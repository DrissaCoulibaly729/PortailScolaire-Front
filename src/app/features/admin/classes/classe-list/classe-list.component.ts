import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { ClasseService } from '../../../../core/services/classe.service';
import { 
  Classe, 
  PaginatedResponse,
  ClasseFilters
} from '../../../../shared/models/classe.model';

interface ClasseAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: (classe: Classe) => void;
}

@Component({
  selector: 'app-classe-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './classe-list.component.html',
  styleUrl: './classe-list.component.css'
})
export class ClasseListComponent implements OnInit, OnDestroy {
  // Données
  classes: Classe[] = [];
  paginationData: PaginatedResponse<Classe>['meta'] | null = null;
  
  // États
  isLoading = true;
  error: string | null = null;
  selectedClasses: number[] = [];
  showFilters = false;
  
  // Formulaires
  searchForm: FormGroup;
  filtersForm: FormGroup;
  
  // Configuration
  niveauxDisponibles = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];
  pageSizeOptions = [10, 15, 25, 50];
  
  // Filtres actuels
  currentFilters: ClasseFilters = {
    page: 1,
    per_page: 15,
    sort_by: 'nom',
    sort_direction: 'asc'
  };
  
  // Actions disponibles
  classeActions: ClasseAction[] = [
    {
      id: 'view',
      label: 'Voir détails',
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      color: 'blue',
      action: (classe: Classe) => this.viewClasse(classe)
    },
    {
      id: 'edit',
      label: 'Modifier',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'green',
      action: (classe: Classe) => this.editClasse(classe)
    },
    {
      id: 'toggle-status',
      label: 'Changer statut',
      icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'orange',
      action: (classe: Classe) => this.toggleClasseStatus(classe)
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      action: (classe: Classe) => this.deleteClasse(classe)
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private classeService: ClasseService,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({
      recherche: ['']
    });

    this.filtersForm = this.formBuilder.group({
      niveau: [''],
      actif: [''],
      per_page: [15]
    });
  }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.setupFiltersSubscription();
    this.loadClasses();
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
        this.loadClasses();
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
          niveau: filters.niveau || undefined,
          actif: filters.actif !== '' ? filters.actif === 'true' : undefined,
          per_page: filters.per_page,
          page: 1
        };
        this.loadClasses();
      });
  }

  /**
   * Charger la liste des classes
   */
  loadClasses(): void {
    this.isLoading = true;
    this.error = null;

    console.log('🏫 Chargement des classes avec filtres:', this.currentFilters);

    this.classeService.getClasses(this.currentFilters).subscribe({
      next: (response) => {
        console.log('📦 Réponse classes:', response);
        
        this.classes = response.data || [];
        this.paginationData = response.meta;
        
        console.log('🏫 Classes chargées:', this.classes.length);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des classes:', error);
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
      this.error = error.message || 'Erreur lors du chargement des classes';
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
    this.loadClasses();
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
    this.loadClasses();
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
    this.loadClasses();
  }

  /**
   * Basculer l'affichage des filtres
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Sélectionner/désélectionner une classe
   */
  toggleClasseSelection(classeId: number): void {
    const index = this.selectedClasses.indexOf(classeId);
    if (index > -1) {
      this.selectedClasses.splice(index, 1);
    } else {
      this.selectedClasses.push(classeId);
    }
  }

  /**
   * Sélectionner toutes les classes visibles
   */
  toggleAllSelection(): void {
    if (this.selectedClasses.length === this.classes.length) {
      this.selectedClasses = [];
    } else {
      this.selectedClasses = this.classes.map(classe => classe.id);
    }
  }

  /**
   * Vérifier si une classe est sélectionnée
   */
  isClasseSelected(classeId: number): boolean {
    return this.selectedClasses.includes(classeId);
  }

  /**
   * Actions sur les classes
   */
  viewClasse(classe: Classe): void {
    console.log('👁️ Voir classe:', classe);
    // Navigation vers les détails
  }

  editClasse(classe: Classe): void {
    console.log('✏️ Éditer classe:', classe);
    // Navigation vers le formulaire d'édition
  }

  toggleClasseStatus(classe: Classe): void {
    const action = classe.actif ? 'désactiver' : 'activer';
    if (confirm(`Voulez-vous ${action} la classe ${classe.nom} ?`)) {
      this.classeService.toggleClasseStatus(classe.id).subscribe({
        next: (updatedClasse) => {
          const index = this.classes.findIndex(c => c.id === classe.id);
          if (index > -1) {
            this.classes[index] = updatedClasse;
          }
          console.log('✅ Statut classe mis à jour');
        },
        error: (error) => {
          console.error('❌ Erreur lors du changement de statut:', error);
        }
      });
    }
  }

  deleteClasse(classe: Classe): void {
    if (classe.effectif_actuel > 0) {
      alert(`Impossible de supprimer la classe ${classe.nom} : elle contient encore ${classe.effectif_actuel} élève(s).`);
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer la classe ${classe.nom} ?\n\nCette action est irréversible.`)) {
      this.classeService.deleteClasse(classe.id).subscribe({
        next: () => {
          this.classes = this.classes.filter(c => c.id !== classe.id);
          this.selectedClasses = this.selectedClasses.filter(id => id !== classe.id);
          console.log('🗑️ Classe supprimée');
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
    if (this.selectedClasses.length === 0) return;
    
    if (confirm(`Voulez-vous supprimer ${this.selectedClasses.length} classe(s) sélectionnée(s) ?\n\nCette action est irréversible.`)) {
      console.log('🗑️ Suppression groupée:', this.selectedClasses);
    }
  }

  exportClasses(): void {
    this.classeService.exportClasses(this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `classes_${new Date().toISOString().split('T')[0]}.csv`;
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
  getClasseFullName(classe: Classe): string {
    return this.classeService.getFullName(classe);
  }

  getTauxOccupation(classe: Classe): number {
    return this.classeService.getTauxOccupation(classe);
  }

  getOccupationColor(classe: Classe): string {
    return this.classeService.getOccupationColor(classe);
  }

  getOccupationClasses(classe: Classe): string {
    const color = this.getOccupationColor(classe);
    return `bg-${color}-100 text-${color}-800`;
  }

  getStatusClasses(actif: boolean): string {
    return actif 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
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
}