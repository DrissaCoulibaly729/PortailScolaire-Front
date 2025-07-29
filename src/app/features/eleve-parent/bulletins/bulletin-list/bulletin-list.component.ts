// src/app/features/eleve-parent/bulletins/bulletin-list/bulletin-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EleveParentService } from '../../../../core/services/eleve-parent.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/auth/auth.service';

import { Bulletin, StatutBulletin, BulletinFilters } from '../../../../shared/models/bulletin.model';
import { User } from '../../../../shared/models/user.model'; // ✅ CORRIGÉ: Import unique depuis user.model

@Component({
  selector: 'app-bulletin-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './bulletin-list.component.html',
  styleUrls: ['./bulletin-list.component.css']
})
export class BulletinListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // État du composant
  bulletins: Bulletin[] = [];
  filteredBulletins: Bulletin[] = [];
  isLoading = true;
  error = '';
  currentUser: User | null = null;

  // Formulaire de filtre
  filterForm: FormGroup;

  // Options de filtre
  anneesDisponibles: string[] = [];
  statutsDisponibles = [
    { value: '', label: 'Tous les statuts' },
    { value: 'publie', label: 'Publié' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'archive', label: 'Archivé' }
  ];

  constructor(
    private eleveParentService: EleveParentService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.filterForm = this.formBuilder.group({
      annee_scolaire: [''],
      statut: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser() as User;
    this.loadBulletins();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les bulletins de l'élève
   */
  private loadBulletins(): void {
    this.isLoading = true;
    this.error = '';

    this.eleveParentService.getBulletinsEleve()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.allowed && response.data) {
            this.bulletins = response.data;
            this.filteredBulletins = [...this.bulletins];
            this.extractAnneesDisponibles();
            this.applyFilters();
          } else {
            this.error = response.reason || 'Accès non autorisé aux bulletins';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des bulletins:', error);
          this.error = 'Erreur lors du chargement des bulletins';
          this.isLoading = false;
          this.notificationService.error('Erreur', 'Impossible de charger les bulletins');
        }
      });
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
   * Extraire les années disponibles
   */
  private extractAnneesDisponibles(): void {
    const annees = [...new Set(this.bulletins.map(b => b.annee_scolaire))];
    this.anneesDisponibles = annees.sort().reverse();
  }

  /**
   * Appliquer les filtres
   */
  private applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredBulletins = this.bulletins.filter(bulletin => {
      // Filtre par année scolaire
      if (filters.annee_scolaire && bulletin.annee_scolaire !== filters.annee_scolaire) {
        return false;
      }

      // Filtre par statut
      if (filters.statut && bulletin.statut !== filters.statut) {
        return false;
      }

      // Filtre par recherche (période, matière)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = `
          ${bulletin.periode?.nom || ''} 
          ${bulletin.classe?.nom || ''}
          ${bulletin.mention || ''}
        `.toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Voir les détails d'un bulletin
   */
  viewBulletin(bulletin: Bulletin): void {
    if (bulletin.statut === 'publie') {
      // Navigation vers les détails
      // this.router.navigate(['/eleve/bulletins', bulletin.id]);
    } else {
      this.notificationService.warning('Information', 'Ce bulletin n\'est pas encore disponible');
    }
  }

  /**
   * Télécharger un bulletin PDF
   */
  downloadBulletin(bulletin: Bulletin, event: Event): void {
    event.stopPropagation();
    
    if (bulletin.statut !== 'publie') {
      this.notificationService.warning('Information', 'Ce bulletin n\'est pas encore disponible en PDF');
      return;
    }

    this.eleveParentService.downloadBulletinPdf(bulletin.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.allowed && response.data) {
            this.downloadFile(response.data, `bulletin-${bulletin.periode?.nom || 'bulletin'}.pdf`);
            this.notificationService.success('Succès', 'Bulletin téléchargé avec succès');
          } else {
            this.notificationService.error('Erreur', response.reason || 'Impossible de télécharger le bulletin');
          }
        },
        error: (error) => {
          console.error('Erreur téléchargement:', error);
          this.notificationService.error('Erreur', 'Échec du téléchargement');
        }
      });
  }

  /**
   * Télécharger un fichier blob
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.filterForm.reset();
  }

  /**
   * Actualiser la liste
   */
  refresh(): void {
    this.loadBulletins();
  }

  /**
   * Obtenir la classe CSS pour le statut
   */
  getStatusClass(statut: StatutBulletin): string {
    const classes = {
      'publie': 'bg-green-100 text-green-800',
      'brouillon': 'bg-yellow-100 text-yellow-800',
      'archive': 'bg-gray-100 text-gray-800'
    };
    return classes[statut] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(statut: StatutBulletin): string {
    const labels = {
      'publie': 'Publié',
      'brouillon': 'En préparation',
      'archive': 'Archivé'
    };
    return labels[statut] || statut;
  }

  /**
   * ✅ CORRIGÉ: Obtenir la couleur de la mention avec signature d'index
   */
  getMentionColor(mention: string): string {
    const colors: Record<string, string> = {
      'Excellent': 'text-green-600',
      'Très bien': 'text-blue-600',
      'Bien': 'text-purple-600',
      'Assez bien': 'text-yellow-600',
      'Passable': 'text-orange-600',
      'Insuffisant': 'text-red-600'
    };
    return colors[mention] || 'text-gray-600';
  }

  /**
   * Formater la moyenne
   */
  formatMoyenne(moyenne: number): string {
    return moyenne ? moyenne.toFixed(2) : '-';
  }

  // ✅ AJOUTÉ: Méthodes pour remplacer les pipes et expressions complexes dans le template

  /**
   * Filtrer les bulletins par statut (remplace le pipe filter)
   */
  getBulletinsByStatut(statut: StatutBulletin): Bulletin[] {
    return this.bulletins.filter(b => b.statut === statut);
  }

  /**
   * Calculer la moyenne générale de tous les bulletins
   */
  calculerMoyenneGenerale(): string {
    if (this.bulletins.length === 0) return '-';
    
    const total = this.bulletins.reduce((sum, bulletin) => sum + (bulletin.moyenne_generale || 0), 0);
    const moyenne = total / this.bulletins.length;
    return moyenne.toFixed(2);
  }

  /**
   * Obtenir le nombre de bulletins publiés
   */
  getNombreBulletinsPublies(): number {
    return this.bulletins.filter(b => b.statut === 'publie').length;
  }
}