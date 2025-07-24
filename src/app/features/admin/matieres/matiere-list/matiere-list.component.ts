import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { MatiereService } from '../../../../core/services/matiere.service';
import { 
  Matiere, 
  PaginatedResponse,
  MatiereFilters
} from '../../../../shared/models/matiere.model';

interface MatiereAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: (matiere: Matiere) => void;
}

@Component({
  selector: 'app-matiere-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './matiere-list.component.html',
  styleUrl: './matiere-list.component.css'
})
export class MatiereListComponent implements OnInit, OnDestroy {
  // Données
  matieres: Matiere[] = [];
  paginationData: PaginatedResponse<Matiere>['meta'] | null = null;
  
  // États
  isLoading = true;
  error: string | null = null;
  selectedMatieres: number[] = [];
  showFilters = false;
  
  // Formulaires
  searchForm: FormGroup;
  filtersForm: FormGroup;
  
  // Configuration
  pageSizeOptions = [10, 15, 25, 50];
  
  // Filtres actuels
  currentFilters: MatiereFilters = {
    page: 1,
    per_page: 15,
    sort_by: 'nom',
    sort_direction: 'asc'
  };
  
  // Actions disponibles
  matiereActions: MatiereAction[] = [
    {
      id: 'view',
      label: 'Voir détails',
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      color: 'blue',
      action: (matiere: Matiere) => this.viewMatiere(matiere)
    },
    {
      id: 'edit',
      label: 'Modifier',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'green',
      action: (matiere: Matiere) => this.editMatiere(matiere)
    },
    {
      id: 'toggle-status',
      label: 'Changer statut',
      icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'orange',
      action: (matiere: Matiere) => this.toggleMatiereStatus(matiere)
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      action: (matiere: Matiere) => this.deleteMatiere(matiere)
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private matiereService: MatiereService,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({
      recherche: ['']
    });

    this.filtersForm = this.formBuilder.group({
      actif: [''],
      coefficient_min: [''],
      coefficient_max: [''],
      per_page: [15]
    });
  }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.setupFiltersSubscription();
    this.loadMatieres();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configuration de la recherche en temps réel
   */
  private setupSearchSubscription(): void {
    this.searchForm.get('recherche')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.currentFilters.recherche = value || undefined;
        this.currentFilters.page = 1;
        this.loadMatieres();
      });
  }

  /**
   * Configuration des filtres
   */
  private setupFiltersSubscription(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(filters => {
        this.currentFilters = {
          ...this.currentFilters,
          actif: filters.actif !== '' ? filters.actif === 'true' : undefined,
          coefficient_min: filters.coefficient_min || undefined,
          coefficient_max: filters.coefficient_max || undefined,
          per_page: filters.per_page,
          page: 1
        };
        this.loadMatieres();
      });
  }

  /**
   * Charger la liste des matières
   */
  loadMatieres(): void {
    this.isLoading = true;
    this.error = null;

    console.log('📚 Chargement des matières avec filtres:', this.currentFilters);

    this.matiereService.getMatieres(this.currentFilters).subscribe({
      next: (response) => {
        console.log('📦 Réponse matières:', response);
        
        this.matieres = response.data || [];
        this.paginationData = response.meta;
        
        console.log('📚 Matières chargées:', this.matieres.length);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des matières:', error);
        this.handleLoadError(error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Gérer les erreurs de chargement
   */
  private handleLoadError(error: any): void {
    if (error.status === 401) {
      this.error = 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      this.error = 'Accès non autorisé à cette ressource.';
    } else if (error.status === 0) {
      this.error = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    } else {
      this.error = error.message || 'Erreur lors du chargement des matières';
    }
  }

  /**
   * Changer de page
   */
  changePage(page: number): void {
    if (page < 1 || (this.paginationData && page > this.paginationData.last_page)) {
      return;
    }
    
    this.currentFilters.page = page;
    this.loadMatieres();
  }

  /**
   * Trier les résultats
   */
  sortBy(field: string): void {
    if (this.currentFilters.sort_by === field) {
      this.currentFilters.sort_direction = 
        this.currentFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentFilters.sort_by = field;
      this.currentFilters.sort_direction = 'asc';
    }
    
    this.currentFilters.page = 1;
    this.loadMatieres();
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.searchForm.reset();
    this.filtersForm.reset({ per_page: 15 });
    this.currentFilters = {
      page: 1,
      per_page: 15,
      sort_by: 'nom',
      sort_direction: 'asc'
    };
    this.loadMatieres();
  }

  /**
   * Basculer l'affichage des filtres
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Sélectionner/désélectionner une matière
   */
  toggleMatiereSelection(matiereId: number): void {
    const index = this.selectedMatieres.indexOf(matiereId);
    if (index > -1) {
      this.selectedMatieres.splice(index, 1);
    } else {
      this.selectedMatieres.push(matiereId);
    }
  }

  /**
   * Sélectionner toutes les matières visibles
   */
  toggleAllSelection(): void {
    if (this.selectedMatieres.length === this.matieres.length) {
      this.selectedMatieres = [];
    } else {
      this.selectedMatieres = this.matieres.map(matiere => matiere.id);
    }
  }

  /**
   * Vérifier si une matière est sélectionnée
   */
  isMatiereSelected(matiereId: number): boolean {
    return this.selectedMatieres.includes(matiereId);
  }

  /**
   * Actions sur les matières
   */
  viewMatiere(matiere: Matiere): void {
    console.log('👁️ Voir matière:', matiere);
    // Navigation vers les détails
  }

  editMatiere(matiere: Matiere): void {
    console.log('✏️ Éditer matière:', matiere);
    // Navigation vers le formulaire d'édition
  }

  toggleMatiereStatus(matiere: Matiere): void {
    const action = matiere.actif ? 'désactiver' : 'activer';
    if (confirm(`Voulez-vous ${action} la matière ${matiere.nom} ?`)) {
      this.matiereService.toggleMatiereStatus(matiere.id).subscribe({
        next: (updatedMatiere) => {
          const index = this.matieres.findIndex(m => m.id === matiere.id);
          if (index > -1) {
            this.matieres[index] = updatedMatiere;
          }
          console.log('✅ Statut matière mis à jour');
        },
        error: (error) => {
          console.error('❌ Erreur lors du changement de statut:', error);
        }
      });
    }
  }

  deleteMatiere(matiere: Matiere): void {
    if (matiere.notes_count && matiere.notes_count > 0) {
      alert(`Impossible de supprimer la matière ${matiere.nom} : elle contient ${matiere.notes_count} note(s).`);
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer la matière ${matiere.nom} ?\n\nCette action est irréversible.`)) {
      this.matiereService.deleteMatiere(matiere.id).subscribe({
        next: () => {
          this.matieres = this.matieres.filter(m => m.id !== matiere.id);
          this.selectedMatieres = this.selectedMatieres.filter(id => id !== matiere.id);
          console.log('🗑️ Matière supprimée');
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression:', error);
        }
      });
    }
  }

  /**
   * Actions groupées
   */
  deleteSelected(): void {
    if (this.selectedMatieres.length === 0) return;
    
    if (confirm(`Voulez-vous supprimer ${this.selectedMatieres.length} matière(s) sélectionnée(s) ?\n\nCette action est irréversible.`)) {
      console.log('🗑️ Suppression groupée:', this.selectedMatieres);
    }
  }

  exportMatieres(): void {
    this.matiereService.exportMatieres(this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `matieres_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        console.log('📥 Export terminé');
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'export:', error);
      }
    });
  }

  /**
   * Méthodes utilitaires
   */
  getCoefficientColor(coefficient: number): string {
    return this.matiereService.getCoefficientColor(coefficient);
  }

  getCoefficientClasses(coefficient: number): string {
    const color = this.getCoefficientColor(coefficient);
    return `bg-${color}-100 text-${color}-800`;
  }

  getStatusClasses(actif: boolean): string {
    return actif 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  formatCoefficient(coefficient: number): string {
    return this.matiereService.formatCoefficient(coefficient);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  canDeleteMatiere(matiere: Matiere): boolean {
    return this.matiereService.canDeleteMatiere(matiere);
  }

  /**
   * Obtenir l'icône de tri
   */
  getSortIcon(field: string): string {
    if (this.currentFilters.sort_by !== field) {
      return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4';
    }
    
    return this.currentFilters.sort_direction === 'asc'
      ? 'M3 4l9 16 9-16H3z'
      : 'M21 20L12 4 3 20h18z';
  }

  /**
   * Générer la plage de pagination
   */
  getPaginationRange(): number[] {
    if (!this.paginationData) return [];
    
    const current = this.paginationData.current_page;
    const total = this.paginationData.last_page;
    const range = [];
    
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  }

  /**
   * Obtenir l'importance d'une matière
   */
  getImportanceLevel(coefficient: number): string {
    return this.matiereService.getImportanceLevel(coefficient);
  }
}