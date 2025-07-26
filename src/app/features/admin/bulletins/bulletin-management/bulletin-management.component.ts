// src/app/features/admin/bulletins/bulletin-management/bulletin-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, forkJoin, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { BulletinService, BulletinGenerationConfig } from '../../../../core/services/bulletin.service';
import { CalculationService } from '../../../../core/services/calculation.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { Bulletin, StatutBulletin, TypePeriode, Periode } from '../../../../shared/models/bulletin.model';
import { Eleve, User } from '../../../../shared/models/user.model';
import { Classe } from '../../../../shared/models/classe.model';

interface BulletinListItem extends Bulletin {
  eleve_nom_complet: string;
  classe_nom: string;
  periode_nom: string;
  statut_label: string;
  actions_disponibles: string[];
  peut_modifier: boolean;
  peut_publier: boolean;
  peut_telecharger: boolean;
}

interface StatistiquesPeriode {
  periode: Periode;
  total_bulletins: number;
  bulletins_publies: number;
  bulletins_brouillons: number;
  moyenne_generale: number;
  repartition_mentions: { mention: string; nombre: number; pourcentage: number }[];
  eleves_sans_bulletin: number;
}

@Component({
  selector: 'app-bulletin-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bulletin-management.component.html',
  styleUrls: ['./bulletin-management.component.css']
})
export class BulletinManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // État du composant
  isLoading = true;
  isGenerating = false;
  error = '';
  currentUser: User | null = null;

  // Formulaires et filtres
  filterForm: FormGroup;
  generationForm: FormGroup;

  // Données
  bulletins: BulletinListItem[] = [];
  bulletinsSelectionnes = new Set<number>();
  classes: Classe[] = [];
  periodes: Periode[] = [];
  eleves: Eleve[] = [];
  
  // Statistiques
  private statistiquesSubject = new BehaviorSubject<StatistiquesPeriode[]>([]);
  statistiques$ = this.statistiquesSubject.asObservable();

  // Pagination et tri
  page = 1;
  pageSize = 20;
  totalBulletins = 0;
  sortBy = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Vue active
  vueActive: 'liste' | 'generation' | 'statistiques' = 'liste';

  // Options
  statutsDisponibles: { value: StatutBulletin; label: string; color: string }[] = [
    { value: 'brouillon', label: 'Brouillon', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'publie', label: 'Publié', color: 'bg-green-100 text-green-800' },
    { value: 'archive', label: 'Archivé', color: 'bg-gray-100 text-gray-800' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private bulletinService: BulletinService,
    private calculationService: CalculationService,
    private pdfService: PdfService,
    private notificationService: NotificationService
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.filterForm = this.createFilterForm();
    this.generationForm = this.createGenerationForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormWatchers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 📝 Créer le formulaire de filtres
   */
  private createFilterForm(): FormGroup {
    return this.fb.group({
      periode_id: [''],
      classe_id: [''],
      statut: [''],
      eleve_search: [''],
      moyenne_min: [''],
      moyenne_max: [''],
      annee_scolaire: ['2024-2025']
    });
  }

  /**
   * 🔧 Créer le formulaire de génération
   */
  private createGenerationForm(): FormGroup {
    return this.fb.group({
      periode_id: ['', [/* Validators.required */]],
      classe_id: [''],
      eleve_ids: [[]],
      generer_pdf: [true],
      envoyer_email: [false],
      inclure_appreciations: [true],
      inclure_statistiques: [false],
      template: ['standard']
    });
  }

  /**
   * 🚀 Charger les données initiales
   */
  private loadInitialData(): void {
    this.isLoading = true;
    
    forkJoin({
      classes: this.bulletinService.apiService.get<Classe[]>('/admin/classes'),
      periodes: this.bulletinService.apiService.get<Periode[]>('/periodes'),
      bulletins: this.loadBulletins()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.classes = data.classes;
        this.periodes = data.periodes.filter(p => p.actif);
        this.processBulletinsList(data.bulletins);
        this.loadStatistiques();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement données:', error);
        this.error = 'Impossible de charger les données';
        this.isLoading = false;
      }
    });
  }

  /**
   * 📊 Charger les bulletins avec filtres
   */
  private loadBulletins(): any {
    const filters = this.filterForm.value;
    return this.bulletinService.rechercherBulletins({
      ...filters,
      page: this.page,
      per_page: this.pageSize,
      sort_by: this.sortBy,
      sort_direction: this.sortDirection
    });
  }

  /**
   * 🔄 Traiter la liste des bulletins
   */
  private processBulletinsList(bulletins: Bulletin[]): void {
    this.bulletins = bulletins.map(bulletin => ({
      ...bulletin,
      eleve_nom_complet: `${bulletin.eleve?.nom} ${bulletin.eleve?.prenom}`,
      classe_nom: bulletin.classe?.nom || 'Non définie',
      periode_nom: bulletin.periode?.nom || 'Non définie',
      statut_label: this.getStatutLabel(bulletin.statut),
      actions_disponibles: this.getActionsDisponibles(bulletin),
      peut_modifier: this.peutModifier(bulletin),
      peut_publier: this.peutPublier(bulletin),
      peut_telecharger: this.peutTelecharger(bulletin)
    }));
  }

  /**
   * 📈 Charger les statistiques
   */
  private loadStatistiques(): void {
    const statsPromises = this.periodes.map(periode =>
      this.bulletinService.getStatistiquesBulletins(periode.id).pipe(
        switchMap(stats => 
          this.bulletinService.getElevesSansBulletin(periode.id).pipe(
            map(elevesSansBulletin => ({
              periode,
              ...stats,
              eleves_sans_bulletin: elevesSansBulletin.length,
              repartition_mentions: Object.entries(stats.repartition_mentions || {}).map(([mention, nombre]) => ({
                mention,
                nombre: nombre as number,
                pourcentage: Math.round((nombre as number / stats.total_bulletins) * 100) || 0
              }))
            }))
          )
        )
      )
    );

    forkJoin(statsPromises)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statistiques) => {
          this.statistiquesSubject.next(statistiques);
        },
        error: (error) => {
          console.error('Erreur chargement statistiques:', error);
        }
      });
  }

  /**
   * 👀 Configurer les watchers des formulaires
   */
  private setupFormWatchers(): void {
    // Watcher pour les filtres
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500)
      )
      .subscribe(() => {
        this.page = 1;
        this.rechargerBulletins();
      });

    // Watcher pour la classe dans le formulaire de génération
    this.generationForm.get('classe_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(classeId => {
        if (classeId) {
          this.chargerElevesClasse(classeId);
        } else {
          this.eleves = [];
        }
      });
  }

  /**
   * 👥 Charger les élèves d'une classe
   */
  private chargerElevesClasse(classeId: number): void {
    this.bulletinService.apiService.get<Eleve[]>(`/admin/classes/${classeId}/eleves`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (eleves) => {
          this.eleves = eleves;
        },
        error: (error) => {
          console.error('Erreur chargement élèves:', error);
          this.eleves = [];
        }
      });
  }

  /**
   * 🔄 Recharger les bulletins
   */
  rechargerBulletins(): void {
    this.loadBulletins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bulletins) => {
          this.processBulletinsList(bulletins);
        },
        error: (error) => {
          console.error('Erreur rechargement bulletins:', error);
          this.notificationService.error('Erreur', 'Impossible de recharger les bulletins');
        }
      });
  }

  /**
   * 🎯 Changer de vue
   */
  changerVue(vue: 'liste' | 'generation' | 'statistiques'): void {
    this.vueActive = vue;
    if (vue === 'statistiques') {
      this.loadStatistiques();
    }
  }

  /**
   * ⭐ Sélectionner/désélectionner un bulletin
   */
  toggleBulletinSelection(bulletinId: number): void {
    if (this.bulletinsSelectionnes.has(bulletinId)) {
      this.bulletinsSelectionnes.delete(bulletinId);
    } else {
      this.bulletinsSelectionnes.add(bulletinId);
    }
  }

  /**
   * 📋 Sélectionner tous les bulletins
   */
  toggleTousLesBulletins(): void {
    if (this.bulletinsSelectionnes.size === this.bulletins.length) {
      this.bulletinsSelectionnes.clear();
    } else {
      this.bulletins.forEach(bulletin => {
        this.bulletinsSelectionnes.add(bulletin.id);
      });
    }
  }

  /**
   * 🔄 Générer les bulletins automatiquement
   */
  async genererBulletinsAutomatiques(): Promise<void> {
    if (this.generationForm.invalid) {
      this.notificationService.warning('Formulaire invalide', 'Veuillez corriger les erreurs');
      return;
    }

    this.isGenerating = true;
    const formValue = this.generationForm.value;

    const config: BulletinGenerationConfig = {
      periode_id: formValue.periode_id,
      classe_id: formValue.classe_id || undefined,
      eleve_ids: formValue.eleve_ids.length > 0 ? formValue.eleve_ids : undefined,
      generer_pdf: formValue.generer_pdf,
      envoyer_email: formValue.envoyer_email,
      inclure_appreciations: formValue.inclure_appreciations,
      inclure_statistiques: formValue.inclure_statistiques
    };

    try {
      const result = await this.bulletinService.genererBulletinsAutomatiques(config).toPromise();
      
      if (result) {
        this.notificationService.success(
          'Génération terminée',
          `${result.bulletins_generes} bulletin(s) généré(s) avec succès`
        );

        if (result.bulletins_echecs > 0) {
          this.notificationService.warning(
            'Avertissement',
            `${result.bulletins_echecs} bulletin(s) en échec`
          );
        }

        // Recharger les données
        this.rechargerBulletins();
        this.loadStatistiques();
        this.vueActive = 'liste';
      }
    } catch (error) {
      console.error('Erreur génération automatique:', error);
      this.notificationService.error(
        'Erreur génération',
        'Impossible de générer les bulletins automatiquement'
      );
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * 📄 Télécharger un bulletin PDF
   */
  telechargerBulletinPDF(bulletin: BulletinListItem): void {
    // Récupérer les données de moyenne pour le PDF
    this.calculationService.calculerMoyennesEleve(
      bulletin.eleve_id,
      [], // Les notes seront chargées par le service
      [], // Les matières seront chargées par le service
      bulletin.periode?.type as TypePeriode
    ).pipe(
      switchMap(moyenneEleve => 
        this.pdfService.telechargerBulletin(bulletin, moyenneEleve)
      ),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Success handled by PdfService
      },
      error: (error) => {
        console.error('Erreur téléchargement PDF:', error);
        this.notificationService.error(
          'Erreur PDF',
          'Impossible de télécharger le bulletin'
        );
      }
    });
  }

  /**
   * 📦 Télécharger les bulletins sélectionnés en lot (FONCTIONNALITÉ BONUS)
   */
  telechargerBulletinsSelectionnes(): void {
    if (this.bulletinsSelectionnes.size === 0) {
      this.notificationService.warning('Aucune sélection', 'Veuillez sélectionner des bulletins');
      return;
    }

    const bulletinIds = Array.from(this.bulletinsSelectionnes);
    
    this.bulletinService.genererPDFsEnLot(bulletinIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success > 0) {
            this.notificationService.success(
              'PDFs générés',
              `${result.success} bulletin(s) prêt(s) à télécharger`
            );
          }
        },
        error: (error) => {
          console.error('Erreur téléchargement groupé:', error);
          this.notificationService.error(
            'Erreur',
            'Impossible de générer les PDFs en lot'
          );
        }
      });
  }

  /**
   * ✅ Publier les bulletins sélectionnés
   */
  publierBulletinsSelectionnes(): void {
    if (this.bulletinsSelectionnes.size === 0) {
      this.notificationService.warning('Aucune sélection', 'Veuillez sélectionner des bulletins');
      return;
    }

    const bulletinIds = Array.from(this.bulletinsSelectionnes);
    const bulletinsAPublier = bulletinIds.filter(id => {
      const bulletin = this.bulletins.find(b => b.id === id);
      return bulletin?.statut === 'brouillon';
    });

    if (bulletinsAPublier.length === 0) {
      this.notificationService.warning('Aucun bulletin', 'Aucun bulletin en brouillon sélectionné');
      return;
    }

    this.bulletinService.publierBulletins(bulletinsAPublier)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.rechargerBulletins();
          this.loadStatistiques();
          this.bulletinsSelectionnes.clear();
        },
        error: (error) => {
          console.error('Erreur publication:', error);
        }
      });
  }

  /**
   * 🔄 Recalculer un bulletin
   */
  recalculerBulletin(bulletin: BulletinListItem): void {
    this.bulletinService.recalculerBulletin(bulletin.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.rechargerBulletins();
        },
        error: (error) => {
          console.error('Erreur recalcul:', error);
        }
      });
  }

  /**
   * 🔄 Synchroniser tous les bulletins avec les nouvelles notes
   */
  synchroniserTousLesBulletins(): void {
    const periodeId = this.filterForm.get('periode_id')?.value;
    const classeId = this.filterForm.get('classe_id')?.value;

    if (!periodeId) {
      this.notificationService.warning('Période requise', 'Veuillez sélectionner une période');
      return;
    }

    this.bulletinService.synchroniserBulletinsAvecNotes(periodeId, classeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.rechargerBulletins();
          this.loadStatistiques();
        },
        error: (error) => {
          console.error('Erreur synchronisation:', error);
        }
      });
  }

  /**
   * 📄 Changer de page
   */
  changerPage(nouvellePage: number): void {
    this.page = nouvellePage;
    this.rechargerBulletins();
  }

  /**
   * 🔄 Changer le tri
   */
  changerTri(colonne: string): void {
    if (this.sortBy === colonne) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = colonne;
      this.sortDirection = 'asc';
    }
    this.rechargerBulletins();
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * 🏷️ Obtenir le libellé du statut
   */
  private getStatutLabel(statut: StatutBulletin): string {
    const statutObj = this.statutsDisponibles.find(s => s.value === statut);
    return statutObj?.label || statut;
  }

  /**
   * 🎨 Obtenir la couleur du statut
   */
  getStatutColor(statut: StatutBulletin): string {
    const statutObj = this.statutsDisponibles.find(s => s.value === statut);
    return statutObj?.color || 'bg-gray-100 text-gray-800';
  }

  /**
   * ⚡ Obtenir les actions disponibles
   */
  private getActionsDisponibles(bulletin: Bulletin): string[] {
    const actions: string[] = [];
    
    if (bulletin.statut === 'brouillon') {
      actions.push('modifier', 'publier', 'recalculer');
    }
    
    if (bulletin.statut === 'publie') {
      actions.push('telecharger', 'archiver');
    }

    actions.push('voir');
    
    return actions;
  }

  /**
   * ✏️ Peut modifier le bulletin
   */
  private peutModifier(bulletin: Bulletin): boolean {
    return bulletin.statut === 'brouillon' && this.currentUser?.role === 'administrateur';
  }

  /**
   * ✅ Peut publier le bulletin
   */
  private peutPublier(bulletin: Bulletin): boolean {
    return bulletin.statut === 'brouillon' && this.currentUser?.role === 'administrateur';
  }

  /**
   * 📄 Peut télécharger le bulletin
   */
  private peutTelecharger(bulletin: Bulletin): boolean {
    return bulletin.statut === 'publie' || this.currentUser?.role === 'administrateur';
  }

  /**
   * 📊 Obtenir le pourcentage de progression
   */
  getPourcentageProgression(moyenne: number): number {
    return Math.round((moyenne / 20) * 100);
  }

  /**
   * 🎨 Obtenir la couleur de la moyenne
   */
  getCouleurMoyenne(moyenne: number): string {
    return this.calculationService.getCouleurMoyenne(moyenne);
  }

  /**
   * 🔍 Filtrer les élèves par recherche
   */
  filtrerEleves(recherche: string): Eleve[] {
    if (!recherche) return this.eleves;
    
    const terme = recherche.toLowerCase();
    return this.eleves.filter(eleve =>
      eleve.nom.toLowerCase().includes(terme) ||
      eleve.prenom.toLowerCase().includes(terme) ||
      eleve.numero_etudiant.toLowerCase().includes(terme)
    );
  }

  /**
   * 📈 Obtenir les statistiques de la période sélectionnée
   */
  getStatistiquesPeriodeSelectionnee(): StatistiquesPeriode | null {
    const periodeId = this.filterForm.get('periode_id')?.value;
    if (!periodeId) return null;

    const stats = this.statistiquesSubject.value;
    return stats.find(s => s.periode.id === +periodeId) || null;
  }

  /**
   * 🔢 Obtenir le nombre total de pages
   */
  get totalPages(): number {
    return Math.ceil(this.totalBulletins / this.pageSize);
  }

  /**
   * ✅ Vérifier si tous les bulletins sont sélectionnés
   */
  get tousLesBulletinsSelectionnes(): boolean {
    return this.bulletins.length > 0 && this.bulletinsSelectionnes.size === this.bulletins.length;
  }
}