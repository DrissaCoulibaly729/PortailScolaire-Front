import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ClasseService } from '../../../../core/services/classe.service';
import { 
  Classe, 
  ClasseFilters, 
  NIVEAUX_DISPONIBLES as NIVEAUX_SCOLAIRES,
  NiveauScolaire 
} from '../../../../shared/models/classe.model';
import { PaginatedResponse } from '../../../../shared/models/common.model';

@Component({
  selector: 'app-classe-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './classe-list.component.html',
})
export class ClasseListComponent implements OnInit {
  classes: Classe[] = [];
  pagination: any = null;
  isLoading = false;
  error: string | null = null;

  // Form and filters
  filterForm: FormGroup;
  niveauxScolaires = NIVEAUX_SCOLAIRES;
  
  // UI state
  openDropdown: number | null = null;

  // Stats
  totalClasses = 0;
  totalEleves = 0;
  tauxOccupation = 0;
  moyenneGenerale = 0;

  constructor(
    private classeService: ClasseService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      recherche: [''],
      niveau: [''],
      actif: [''],
      per_page: [25]
    });
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.loadClasses();
    this.loadStats();
  }

  /**
   * Initialize filters with debouncing
   */
  private initializeFilters(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadClasses();
    });
  }

  /**
   * Load classes with current filters
   */
  loadClasses(page: number = 1): void {
    this.isLoading = true;
    this.error = null;

    const filters: ClasseFilters = {
      ...this.filterForm.value,
      page
    };

    // Clean empty filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof ClasseFilters] === '' || filters[key as keyof ClasseFilters] === null) {
        delete filters[key as keyof ClasseFilters];
      }
    });

    this.classeService.getClasses(filters).subscribe({
      next: (response) => {
        this.classes = response.data;
        this.pagination = {
          meta: response.meta,
          links: response.links
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des classes:', error);
        this.error = 'Impossible de charger les classes';
        this.isLoading = false;
        
        // Load mock data for demo
        this.loadMockData();
      }
    });
  }

  /**
   * Load statistics
   */
  loadStats(): void {
  this.classeService.getClasseStatistiques().subscribe({
    next: (response) => {
      // Accéder aux statistiques dans la propriété 'statistiques'
      const stats = response.statistiques;
      
      this.totalClasses = stats.total_classes || 0;
      this.totalEleves = stats.effectif_total || 0; // ✅ Propriété corrigée
      this.tauxOccupation = Math.round(stats.taux_occupation || 0); // ✅ Arrondir le pourcentage
      
      // ✅ Calculer la moyenne générale s'il n'y en a pas dans l'API
      // Ou ajouter cette propriété dans votre API Laravel
      this.moyenneGenerale = 0; // À implémenter côté API si nécessaire
      
      // ✅ Optionnel : Log des détails par niveau
      // if (stats.niveaux && Array.isArray(stats.niveaux)) {
      //   console.log('Détail par niveaux:', stats.niveaux);
      // }
    },
    error: (error) => {
      console.error('Erreur lors du chargement des statistiques:', error);
      // Default values en cas d'erreur
      this.totalClasses = 12;
      this.totalEleves = 324;
      this.tauxOccupation = 85;
      this.moyenneGenerale = 13.2;
    }
  });
}
  /**
   * Load mock data for demonstration
   */
  private loadMockData(): void {
    this.classes = [
      {
        id: 1,
        nom: '6ème A',
        niveau: '6ème' as NiveauScolaire,
        section: 'A',
        effectif_max: 30,
        effectif_actuel: 28,
        description: 'Classe de 6ème section A',
        actif: true,
        moyenne: 13.5,
        enseignants: [],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        nom: '5ème B',
        niveau: '5ème' as NiveauScolaire,
        section: 'B',
        effectif_max: 32,
        effectif_actuel: 30,
        description: 'Classe de 5ème section B',
        actif: true,
        moyenne: 12.8,
        enseignants: [],
        created_at: '2024-01-16T11:00:00Z',
        updated_at: '2024-01-21T15:45:00Z'
      },
      {
        id: 3,
        nom: 'Terminale C',
        niveau: 'Terminale' as NiveauScolaire,
        section: 'C',
        effectif_max: 25,
        effectif_actuel: 23,
        description: 'Classe de Terminale C - Sciences',
        actif: true,
        moyenne: 14.2,
        enseignants: [],
        created_at: '2024-01-17T12:00:00Z',
        updated_at: '2024-01-22T16:00:00Z'
      }
    ];

    this.pagination = {
      meta: {
        current_page: 1,
        per_page: 25,
        total: 3,
        last_page: 1,
        from: 1,
        to: 3
      },
      links: {
        first: null,
        last: null,
        prev: null,
        next: null
      }
    };

    this.isLoading = false;
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.filterForm.reset({
      recherche: '',
      niveau: '',
      actif: '',
      per_page: 25
    });
  }

  /**
   * Calculate occupation percentage
   */
  getOccupationPercentage(classe: Classe): number {
    if (!classe.effectif_max || classe.effectif_max === 0) return 0;
    return Math.round(((classe.effectif_actuel || 0) / classe.effectif_max) * 100);
  }

  /**
   * Toggle dropdown menu
   */
  toggleDropdown(classeId: number): void {
    this.openDropdown = this.openDropdown === classeId ? null : classeId;
  }

  /**
   * Close dropdown when clicking outside
   */
  closeDropdown(): void {
    this.openDropdown = null;
  }

  /**
   * Class actions
   */
  viewClasse(classe: Classe): void {
    this.router.navigate(['/admin/classes', classe.id]);
    this.closeDropdown();
  }

  editClasse(classe: Classe): void {
    this.router.navigate(['/admin/classes/edit', classe.id]);
    this.closeDropdown();
  }

  toggleClasseStatus(classe: Classe): void {
    const action = classe.actif ? 'désactiver' : 'activer';
    
    if (confirm(`Êtes-vous sûr de vouloir ${action} la classe "${classe.nom}" ?`)) {
      this.classeService.toggleClasseStatus(classe.id).subscribe({
        next: () => {
          classe.actif = !classe.actif;
          console.log(`Classe ${action}e avec succès`);
        },
        error: (error) => {
          console.error(`Erreur lors de la modification du statut:`, error);
          alert(`Impossible de ${action} la classe`);
        }
      });
    }
    this.closeDropdown();
  }

  manageTeachers(classe: Classe): void {
    // Navigate to teacher management for this class
    this.router.navigate(['/admin/classes', classe.id, 'teachers']);
    this.closeDropdown();
  }

  viewStudents(classe: Classe): void {
    // Navigate to student list for this class
    this.router.navigate(['/admin/classes', classe.id, 'students']);
    this.closeDropdown();
  }

  deleteClasse(classe: Classe): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la classe "${classe.nom}" ?`)) {
      this.classeService.deleteClasse(classe.id).subscribe({
        next: () => {
          this.classes = this.classes.filter(c => c.id !== classe.id);
          console.log('Classe supprimée avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Impossible de supprimer la classe');
        }
      });
    }
    this.closeDropdown();
  }

  /**
   * Show statistics modal
   */
  showStatistics(): void {
    // Implementation for statistics modal
    console.log('Show statistics modal');
  }

  /**
   * Pagination
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination?.meta.last_page || 1)) {
      this.loadClasses(page);
    }
  }

  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const current = this.pagination.meta.current_page;
    const last = this.pagination.meta.last_page;
    const pages: number[] = [];
    
    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}