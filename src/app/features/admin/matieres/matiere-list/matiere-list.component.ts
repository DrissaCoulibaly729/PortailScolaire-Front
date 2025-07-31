import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatiereService } from '../../../../core/services/matiere.service';
import { 
  Matiere, 
  MatiereFilters, 
  PaginatedResponse 
} from '../../../../shared/models/matiere.model';
import { UserRole } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-matiere-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './matiere-list.component.html',
})
export class MatiereListComponent implements OnInit {
  matieres: Matiere[] = [];
  pagination: any = null;
  isLoading = false;
  error: string | null = null;

  // Form and filters
  filterForm: FormGroup;
  
  // UI state
  openDropdown: number | null = null;

  // Stats
  totalMatieres = 0;
  totalEnseignants = 0;
  matieresActives = 0;
  coefficientMoyen = 0;

  constructor(
    private matiereService: MatiereService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      recherche: [''],
      actif: [''],
      coefficient: [''],
      per_page: [25]
    });
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.loadMatieres();
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
      this.loadMatieres();
    });
  }

  /**
   * Load matieres with current filters
   */
  loadMatieres(page: number = 1): void {
    this.isLoading = true;
    this.error = null;

    const filters: MatiereFilters = {
      ...this.filterForm.value,
      page
    };

    // Clean empty filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof MatiereFilters] === '' || filters[key as keyof MatiereFilters] === null) {
        delete filters[key as keyof MatiereFilters];
      }
    });

    this.matiereService.getMatieres(filters).subscribe({
      next: (response) => {
        this.matieres = response.data;
        this.pagination = {
          meta: response.meta,
          links: response.links
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des matières:', error);
        this.error = 'Impossible de charger les matières';
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
  this.matiereService.getMatieres({ per_page: 1000 }).subscribe({
    next: (response) => {
      const matieres = response.data || [];

      this.totalMatieres = response.meta?.total || matieres.length;
      this.matieresActives = matieres.filter((m: any) => m.active).length;
      this.totalEnseignants = matieres.reduce(
        (total: number, m: any) => total + (m.enseignants_count || 0),
        0
      );
      const moyenne = matieres.length > 0 
        ? matieres.reduce((sum: number, m: any) => sum + parseFloat(m.coefficient), 0) / matieres.length
        : 0;

      this.coefficientMoyen = parseFloat(moyenne.toFixed(2)); // ✅ formaté à 2 décimales
    },
    error: (err) => {
      console.error('Erreur lors du chargement des statistiques:', err);
      this.error = 'Impossible de charger les statistiques';
    }
  });
}



  /**
   * Load mock data for demonstration
   */
  private loadMockData(): void {
  this.matieres = [
    {
      id: 1,
      nom: 'Mathématiques',
      code: 'MATH',
      coefficient: 4,
      description: 'Mathématiques niveau collège',
      active: true, // ✅ Propriété ajoutée
      actif: true,
      nombre_notes: 45,
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-15T08:00:00Z',
      enseignants: [
        { 
          id: 1, 
          nom: 'Dupont', 
          prenom: 'Jean', 
          email: 'jean.dupont@ecole.fr',
          // ✅ Propriétés complètes pour Enseignant
          identifiant_connexion: 'jean.dupont',
          role: 'enseignant' as UserRole,
          actif: true,
          telephone: '0123456789',
          created_at: '2024-01-15T08:00:00Z',
          updated_at: '2024-01-15T08:00:00Z'
        },
        { 
          id: 2, 
          nom: 'Martin', 
          prenom: 'Marie', 
          email: 'marie.martin@ecole.fr',
          identifiant_connexion: 'marie.martin',
          role: 'enseignant' as UserRole,
          actif: true,
          telephone: '0123456780',
          created_at: '2024-01-15T08:00:00Z',
          updated_at: '2024-01-15T08:00:00Z'
        }
      ]
    },
    {
      id: 2,
      nom: 'Français',
      code: 'FR',
      coefficient: 3,
      description: 'Français niveau collège',
      active: true, // ✅ Propriété ajoutée
      actif: true,
      nombre_notes: 32,
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-15T08:00:00Z',
      enseignants: [
        { 
          id: 3, 
          nom: 'Durand', 
          prenom: 'Sophie', 
          email: 'sophie.durand@ecole.fr',
          identifiant_connexion: 'sophie.durand',
          role: 'enseignant' as UserRole,
          actif: true,
          telephone: '0123456781',
          created_at: '2024-01-15T08:00:00Z',
          updated_at: '2024-01-15T08:00:00Z'
        }
      ]
    },
    {
      id: 3,
      nom: 'Histoire',
      code: 'HIST',
      coefficient: 2,
      description: 'Histoire niveau collège',
      active: false, // ✅ Propriété ajoutée
      actif: false,
      nombre_notes: 0,
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-15T08:00:00Z',
      enseignants: [
        { 
          id: 4, 
          nom: 'Moreau', 
          prenom: 'Pierre', 
          email: 'pierre.moreau@ecole.fr',
          identifiant_connexion: 'pierre.moreau',
          role: 'enseignant' as UserRole,
          actif: true,
          telephone: '0123456782',
          created_at: '2024-01-15T08:00:00Z',
          updated_at: '2024-01-15T08:00:00Z'
        }
      ]
    }
  ];
}

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.filterForm.reset({
      recherche: '',
      actif: '',
      coefficient: '',
      per_page: 25
    });
  }

  /**
   * Toggle dropdown menu
   */
  toggleDropdown(matiereId: number): void {
    this.openDropdown = this.openDropdown === matiereId ? null : matiereId;
  }

  /**
   * Close dropdown when clicking outside
   */
  closeDropdown(): void {
    this.openDropdown = null;
  }

  /**
   * Matiere actions
   */
  viewMatiere(matiere: Matiere): void {
    this.router.navigate(['/admin/matieres', matiere.id]);
    this.closeDropdown();
  }

  editMatiere(matiere: Matiere): void {
    this.router.navigate(['/admin/matieres', matiere.id, 'edit']);
    this.closeDropdown();
  }

  manageTeachers(matiere: Matiere): void {
    this.router.navigate(['/admin/matieres', matiere.id, 'teachers']);
    this.closeDropdown();
  }

  toggleMatiereStatus(matiere: Matiere): void {
    const action = matiere.actif ? 'désactiver' : 'activer';
    
    if (confirm(`Êtes-vous sûr de vouloir ${action} la matière "${matiere.nom}" ?`)) {
      this.matiereService.toggleMatiereStatus(matiere.id).subscribe({
        next: () => {
          matiere.actif = !matiere.actif;
          console.log(`Matière ${action}e avec succès`);
        },
        error: (error) => {
          console.error(`Erreur lors de la modification du statut:`, error);
          alert(`Impossible de ${action} la matière`);
        }
      });
    }
    this.closeDropdown();
  }

  viewNotes(matiere: Matiere): void {
    this.router.navigate(['/admin/matieres', matiere.id, 'notes']);
    this.closeDropdown();
  }

  generateReport(matiere: Matiere): void {
    console.log('Generate report for matiere:', matiere.nom);
    this.closeDropdown();
  }

  deleteMatiere(matiere: Matiere): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la matière "${matiere.nom}" ?`)) {
      this.matiereService.deleteMatiere(matiere.id).subscribe({
        next: () => {
          this.matieres = this.matieres.filter(m => m.id !== matiere.id);
          console.log('Matière supprimée avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Impossible de supprimer la matière');
        }
      });
    }
    this.closeDropdown();
  }

  /**
   * Show statistics modal
   */
  showStatistics(): void {
    console.log('Show statistics modal');
  }

  /**
   * Pagination
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination?.meta.last_page || 1)) {
      this.loadMatieres(page);
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