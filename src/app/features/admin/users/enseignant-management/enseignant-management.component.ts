// src/app/features/admin/users/enseignant-management/enseignant-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EnseignantService, EnseignantDetails, ClasseWithEffectif } from '../../../../core/services/enseignant.service';
import { Matiere } from '../../../../shared/models/matiere.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-enseignant-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './enseignant-management.component.html',
  styleUrl: './enseignant-management.component.css'
})
export class EnseignantManagementComponent implements OnInit {
  enseignants: EnseignantDetails[] = [];
  availableMatieres: Matiere[] = [];
  availableClasses: ClasseWithEffectif[] = [];
  
  loading = false;
  error: string | null = null;
  
  filterForm: FormGroup;
  openEnseignantMenu: number | null = null;

  constructor(
    private enseignantService: EnseignantService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      recherche: [''],
      matiere_id: [''],
      classe_id: [''],
      actif: [''],
      specialite: ['']
    });
  }

  ngOnInit(): void {
    this.loadEnseignants();
    this.loadMatieres();
    this.loadClasses();
    this.setupFilterSubscription();
  }

  /**
   * ✅ CORRIGÉ - Charger les enseignants sans fake data
   */
  private loadEnseignants(): void {
    this.loading = true;
    this.error = null;

    const filters = this.filterForm.value;
    
    this.enseignantService.getEnseignants(filters).subscribe({
      next: (enseignants) => {
        this.enseignants = enseignants;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des enseignants';
        this.loading = false;
        this.enseignants = []; // ✅ Pas de fake data
        console.error('Erreur:', error);
      }
    });
  }

  /**
   * ✅ CORRIGÉ - Charger les matières sans fake data
   */
  private loadMatieres(): void {
    this.enseignantService.getMatieresDisponibles().subscribe({
      next: (matieres) => {
        this.availableMatieres = matieres;
      },
      error: (error) => {
        console.error('Erreur chargement matières:', error);
        this.availableMatieres = []; // ✅ Pas de fake data
      }
    });
  }

  /**
   * ✅ CORRIGÉ - Charger les classes sans fake data
   */
  private loadClasses(): void {
    this.enseignantService.getClassesDisponibles().subscribe({
      next: (classes) => {
        this.availableClasses = classes;
      },
      error: (error) => {
        console.error('Erreur chargement classes:', error);
        this.availableClasses = []; // ✅ Pas de fake data
      }
    });
  }

  /**
   * ✅ AJOUTÉ - Configuration des filtres avec debounce
   */
  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.loadEnseignants();
      });
  }

  /**
   * Actions des enseignants
   */
  createEnseignant(): void {
    this.router.navigate(['/admin/utilisateurs/create'], {
      queryParams: { role: 'enseignant' }
    });
  }

  viewEnseignantDetails(enseignant: EnseignantDetails): void {
    this.router.navigate(['/admin/utilisateurs', enseignant.id]);
    this.closeEnseignantMenu();
  }

  editEnseignant(enseignant: EnseignantDetails): void {
    this.router.navigate(['/admin/utilisateurs', enseignant.id, 'edit']);
    this.closeEnseignantMenu();
  }

  manageAssignments(enseignant: EnseignantDetails): void {
    // TODO: Implémenter la gestion des affectations
    console.log('Gérer les affectations pour:', enseignant.nom);
    this.closeEnseignantMenu();
  }

  generateReport(enseignant: EnseignantDetails): void {
    this.enseignantService.genererRapportEnseignant(enseignant.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport_enseignant_${enseignant.nom}_${enseignant.prenom}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur génération rapport:', error);
        alert('Erreur lors de la génération du rapport');
      }
    });
    this.closeEnseignantMenu();
  }

  exportEnseignants(): void {
    const filters = this.filterForm.value;
    
    this.enseignantService.exporterEnseignants(filters, 'excel').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `enseignants_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur export:', error);
        alert('Erreur lors de l\'export');
      }
    });
  }

  /**
   * Méthodes utilitaires
   */
  getActivesCount(): number {
    return this.enseignants.filter(e => e.actif).length;
  }

  getTotalMatieres(): number {
    const matieres = new Set();
    this.enseignants.forEach(e => {
      e.matieres?.forEach(m => matieres.add(m.id));
    });
    return matieres.size;
  }

  getTotalClasses(): number {
    const classes = new Set();
    this.enseignants.forEach(e => {
      e.classes?.forEach(c => classes.add(c.id));
    });
    return classes.size;
  }

  getStatusClasses(actif: boolean): string {
    return actif 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  toggleEnseignantMenu(enseignantId: number): void {
    this.openEnseignantMenu = this.openEnseignantMenu === enseignantId ? null : enseignantId;
  }

  closeEnseignantMenu(): void {
    this.openEnseignantMenu = null;
  }

  resetFilters(): void {
    this.filterForm.reset({
      recherche: '',
      matiere_id: '',
      classe_id: '',
      actif: '',
      specialite: ''
    });
  }

  trackByEnseignantId(index: number, enseignant: EnseignantDetails): number {
    return enseignant.id;
  }
}