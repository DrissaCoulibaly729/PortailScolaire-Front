// src/app/features/eleve-parent/notes/eleve-notes.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EleveParentService } from '../../../core/services/eleve-parent.service';
import { NotificationService } from '../../../core/services/notification.service';

import { Note } from '../../../shared/models/note.model';
import { Matiere } from '../../../shared/models/matiere.model';

interface NotesByMatiere {
  matiere: Matiere;
  notes: Note[];
  moyenne: number;
  nombreNotes: number;
  derniere_note: Note | null;
}

@Component({
  selector: 'app-eleve-notes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './eleve-notes.component.html',
  styleUrls: ['./eleve-notes.component.css']
})
export class EleveNotesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // État du composant
  notesByMatiere: NotesByMatiere[] = [];
  filteredNotes: NotesByMatiere[] = [];
  isLoading = true;
  error = '';
  matiereIdFromRoute: number | null = null;

  // Formulaire de filtre
  filterForm: FormGroup;

  // Statistiques générales
  moyenneGenerale = 0;
  nombreTotalNotes = 0;
  meilleureMatiere = '';
  meilleureNote = 0;

  // Options de filtre
  typesEvaluation = [
    { value: '', label: 'Tous les types' },
    { value: 'devoir_surveille', label: 'Devoir surveillé' },
    { value: 'controle_continu', label: 'Contrôle continu' },
    { value: 'examen', label: 'Examen' },
    { value: 'oral', label: 'Oral' },
    { value: 'projet', label: 'Projet' }
  ];

  constructor(
    private route: ActivatedRoute,
    private eleveParentService: EleveParentService,
    private notificationService: NotificationService,
    private formBuilder: FormBuilder
  ) {
    this.filterForm = this.formBuilder.group({
      matiere_id: [''],
      type_evaluation: [''],
      search: [''],
      periode: [''],
      note_min: [''],
      note_max: ['']
    });
  }

  ngOnInit(): void {
    // Vérifier si une matière spécifique est demandée via la route
    this.route.params.subscribe(params => {
      if (params['matiereId']) {
        this.matiereIdFromRoute = +params['matiereId'];
        this.filterForm.patchValue({ matiere_id: this.matiereIdFromRoute });
      }
    });

    this.loadNotes();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les notes de l'élève
   */
  private loadNotes(): void {
    this.isLoading = true;
    this.error = '';

    const matiereId = this.matiereIdFromRoute || undefined;

    this.eleveParentService.getNotesEleve(undefined, matiereId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.allowed && response.data) {
            this.organizeNotesByMatiere(response.data);
            this.calculateStatistics();
            this.applyFilters();
          } else {
            this.error = response.reason || 'Accès non autorisé aux notes';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notes:', error);
          this.error = 'Erreur lors du chargement des notes';
          this.isLoading = false;
          this.notificationService.error('Erreur', 'Impossible de charger les notes');
        }
      });
  }

  /**
   * Organiser les notes par matière
   */
  private organizeNotesByMatiere(notes: Note[]): void {
    const matiereMap = new Map<number, NotesByMatiere>();

    notes.forEach(note => {
      if (!note.matiere) return;

      const matiereId = note.matiere.id;
      if (!matiereMap.has(matiereId)) {
        matiereMap.set(matiereId, {
          matiere: note.matiere,
          notes: [],
          moyenne: 0,
          nombreNotes: 0,
          derniere_note: null
        });
      }

      const matiereData = matiereMap.get(matiereId)!;
      matiereData.notes.push(note);
    });

    // Calculer les moyennes et trier les notes
    this.notesByMatiere = Array.from(matiereMap.values()).map(matiereData => {
      // Trier les notes par date (plus récente en premier)
      matiereData.notes.sort((a, b) => {
        const dateA = new Date(a.date_evaluation || a.created_at);
        const dateB = new Date(b.date_evaluation || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      // Calculer la moyenne pondérée
      let totalPoints = 0;
      let totalCoefficients = 0;

      matiereData.notes.forEach(note => {
        const coefficient = note.coefficient || 1;
        const noteNormalisee = (note.valeur / (note.note_sur || 20)) * 20;
        totalPoints += noteNormalisee * coefficient;
        totalCoefficients += coefficient;
      });

      matiereData.moyenne = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
      matiereData.nombreNotes = matiereData.notes.length;
      matiereData.derniere_note = matiereData.notes[0] || null;

      return matiereData;
    });

    // Trier les matières par ordre alphabétique
    this.notesByMatiere.sort((a, b) => a.matiere.nom.localeCompare(b.matiere.nom));
  }

  /**
   * Calculer les statistiques générales
   */
  private calculateStatistics(): void {
    this.nombreTotalNotes = this.notesByMatiere.reduce((total, matiere) => total + matiere.nombreNotes, 0);

    if (this.notesByMatiere.length > 0) {
      // Moyenne générale pondérée par les coefficients des matières
      let totalPoints = 0;
      let totalCoefficients = 0;
      let meilleureNote = 0;
      let meilleureMatiere = '';

      this.notesByMatiere.forEach(matiereData => {
        const coefficient = matiereData.matiere.coefficient || 1;
        totalPoints += matiereData.moyenne * coefficient;
        totalCoefficients += coefficient;

        if (matiereData.moyenne > meilleureNote) {
          meilleureNote = matiereData.moyenne;
          meilleureMatiere = matiereData.matiere.nom;
        }
      });

      this.moyenneGenerale = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
      this.meilleureNote = meilleureNote;
      this.meilleureMatiere = meilleureMatiere;
    }
  }

  /**
   * Configurer les filtres
   */
  private setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  /**
   * Appliquer les filtres
   */
  private applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredNotes = this.notesByMatiere.filter(matiereData => {
      // Filtre par matière
      if (filters.matiere_id && matiereData.matiere.id !== +filters.matiere_id) {
        return false;
      }

      // Filtre par moyenne de la matière
      if (filters.note_min && matiereData.moyenne < +filters.note_min) {
        return false;
      }
      if (filters.note_max && matiereData.moyenne > +filters.note_max) {
        return false;
      }

      // Filtre par recherche textuelle
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!matiereData.matiere.nom.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      return true;
    }).map(matiereData => {
      // Filtrer les notes individuelles au sein de chaque matière
      const filteredNotes = matiereData.notes.filter(note => {
        // Filtre par type d'évaluation
        if (filters.type_evaluation && note.type_evaluation !== filters.type_evaluation) {
          return false;
        }

        return true;
      });

      return {
        ...matiereData,
        notes: filteredNotes
      };
    }).filter(matiereData => matiereData.notes.length > 0);
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.filterForm.reset();
    if (this.matiereIdFromRoute) {
      this.filterForm.patchValue({ matiere_id: this.matiereIdFromRoute });
    }
  }

  /**
   * Actualiser les notes
   */
  refresh(): void {
    this.loadNotes();
  }

  /**
   * Obtenir la couleur selon la note
   */
  getNoteColor(note: number): string {
    if (note >= 16) return 'text-green-600';
    if (note >= 14) return 'text-blue-600';
    if (note >= 12) return 'text-purple-600';
    if (note >= 10) return 'text-yellow-600';
    if (note >= 8) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Obtenir la couleur de fond selon la note
   */
  getNoteBgColor(note: number): string {
    if (note >= 16) return 'bg-green-50 border-green-200';
    if (note >= 14) return 'bg-blue-50 border-blue-200';
    if (note >= 12) return 'bg-purple-50 border-purple-200';
    if (note >= 10) return 'bg-yellow-50 border-yellow-200';
    if (note >= 8) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  }

  /**
   * Obtenir la mention selon la note
   */
  getMention(note: number): string {
    if (note >= 16) return 'Excellent';
    if (note >= 14) return 'Très bien';
    if (note >= 12) return 'Bien';
    if (note >= 10) return 'Assez bien';
    if (note >= 8) return 'Passable';
    return 'Insuffisant';
  }

  /**
   * Formater une note
   */
  formatNote(note: number): string {
    return note ? note.toFixed(2) : '-';
  }

  /**
   * Obtenir le pourcentage de la note
   */
  getNotePercentage(note: number): number {
    return (note / 20) * 100;
  }

  /**
   * Obtenir les matières disponibles pour le filtre
   */
  getMatieresDisponibles(): Matiere[] {
    return this.notesByMatiere.map(item => item.matiere);
  }

  /**
   * Vérifier si une note est récente (moins de 7 jours)
   */
  isRecentNote(note: Note): boolean {
    const noteDate = new Date(note.date_evaluation || note.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - noteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  /**
   * Obtenir l'évolution par rapport à la note précédente
   */
  getNoteEvolution(note: Note, notes: Note[]): string {
    const currentIndex = notes.findIndex(n => n.id === note.id);
    if (currentIndex === -1 || currentIndex === notes.length - 1) {
      return '';
    }

    const previousNote = notes[currentIndex + 1];
    const currentNormalized = (note.valeur / (note.note_sur || 20)) * 20;
    const previousNormalized = (previousNote.valeur / (previousNote.note_sur || 20)) * 20;
    
    const diff = currentNormalized - previousNormalized;
    
    if (Math.abs(diff) < 0.5) return '';
    
    return diff > 0 ? 'progression' : 'regression';
  }
}