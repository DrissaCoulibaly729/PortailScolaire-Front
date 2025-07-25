import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ClasseService } from '../../../../core/services/classe.service';
import { UserService } from '../../../../core/services/user.service';
import { 
  Classe, 
  CreateClasseRequest, 
  UpdateClasseRequest,
  NIVEAUX_DISPONIBLES as NIVEAUX_SCOLAIRES,
  NiveauScolaire 
} from '../../../../shared/models/classe.model';
import { User } from '../../../../shared/models/user.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-classe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ isEditing ? 'Modifier la classe' : 'Créer une nouvelle classe' }}
            </h1>
            <p class="text-gray-600 mt-2">
              {{ isEditing ? 'Modifiez les informations de la classe' : 'Remplissez les informations pour créer une nouvelle classe' }}
            </p>
          </div>
          <button (click)="goBack()" 
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Retour
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="max-w-3xl mx-auto">
        <form [formGroup]="classeForm" (ngSubmit)="onSubmit()" class="space-y-8">
          <!-- Basic Information -->
          <div class="bg-white shadow-sm rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Informations générales
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Nom de la classe -->
              <div>
                <label for="nom" class="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la classe <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       id="nom"
                       formControlName="nom"
                       placeholder="Ex: 6ème A, Terminale S1..."
                       [class.border-red-300]="classeForm.get('nom')?.invalid && classeForm.get('nom')?.touched"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                <div *ngIf="classeForm.get('nom')?.invalid && classeForm.get('nom')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  Le nom de la classe est requis
                </div>
              </div>

              <!-- Niveau -->
              <div>
                <label for="niveau" class="block text-sm font-medium text-gray-700 mb-2">
                  Niveau <span class="text-red-500">*</span>
                </label>
                <select id="niveau"
                        formControlName="niveau"
                        [class.border-red-300]="classeForm.get('niveau')?.invalid && classeForm.get('niveau')?.touched"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option value="">Sélectionnez un niveau</option>
                  <option *ngFor="let niveau of niveauxScolaires" [value]="niveau.value">
                    {{ niveau.label }}
                  </option>
                </select>
                <div *ngIf="classeForm.get('niveau')?.invalid && classeForm.get('niveau')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  Le niveau est requis
                </div>
              </div>

              <!-- Section -->
              <div>
                <label for="section" class="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <input type="text" 
                       id="section"
                       formControlName="section"
                       placeholder="Ex: A, B, C, S1, L2..."
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
              </div>

              <!-- Effectif maximum -->
              <div>
                <label for="effectif_max" class="block text-sm font-medium text-gray-700 mb-2">
                  Effectif maximum <span class="text-red-500">*</span>
                </label>
                <input type="number" 
                       id="effectif_max"
                       formControlName="effectif_max"
                       min="1"
                       max="50"
                       placeholder="30"
                       [class.border-red-300]="classeForm.get('effectif_max')?.invalid && classeForm.get('effectif_max')?.touched"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                <div *ngIf="classeForm.get('effectif_max')?.invalid && classeForm.get('effectif_max')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  <span *ngIf="classeForm.get('effectif_max')?.errors?.['required']">
                    L'effectif maximum est requis
                  </span>
                  <span *ngIf="classeForm.get('effectif_max')?.errors?.['min']">
                    L'effectif maximum doit être d'au moins 1
                  </span>
                  <span *ngIf="classeForm.get('effectif_max')?.errors?.['max']">
                    L'effectif maximum ne peut pas dépasser 50
                  </span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="mt-6">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea id="description"
                        formControlName="description"
                        rows="3"
                        placeholder="Description optionnelle de la classe..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"></textarea>
            </div>
          </div>

          <!-- Enseignants Assignment (if editing) -->
          <div *ngIf="isEditing" class="bg-white shadow-sm rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Enseignants affectés
            </h3>

            <!-- Current Teachers -->
            <div *ngIf="currentClasse?.enseignants && currentClasse.enseignants.length > 0" class="mb-6">
              <h4 class="text-sm font-medium text-gray-700 mb-3">Enseignants actuels</h4>
              <div class="space-y-2">
                <div *ngFor="let enseignant of currentClasse.enseignants" 
                     class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="flex items-center">
                    <div class="h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center">
                      <span class="text-xs font-medium text-blue-800">
                        {{ enseignant.nom.charAt(0) }}{{ enseignant.prenom.charAt(0) }}
                      </span>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">{{ enseignant.nom }} {{ enseignant.prenom }}</p>
                      <p class="text-xs text-gray-500">{{ enseignant.email }}</p>
                    </div>
                  </div>
                  <button type="button" 
                          (click)="removeTeacher(enseignant.id)"
                          class="text-red-600 hover:text-red-800">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Add Teacher -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-3">Ajouter un enseignant</h4>
              <div class="flex space-x-3">
                <select formControlName="selectedTeacher" 
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option value="">Sélectionnez un enseignant</option>
                  <option *ngFor="let teacher of availableTeachers" [value]="teacher.id">
                    {{ teacher.nom }} {{ teacher.prenom }} - {{ teacher.email }}
                  </option>
                </select>
                <button type="button" 
                        (click)="addTeacher()"
                        [disabled]="!classeForm.get('selectedTeacher')?.value"
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div class="bg-white shadow-sm rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Statut
            </h3>

            <div class="flex items-center">
              <input type="checkbox" 
                     id="active"
                     formControlName="active"
                     class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
              <label for="active" class="ml-2 text-sm text-gray-700">
                Classe active
              </label>
            </div>
            <p class="mt-2 text-sm text-gray-500">
              Les classes inactives ne sont pas visibles dans les listes et ne peuvent pas recevoir de nouveaux élèves.
            </p>
          </div>

          <!-- Error Display -->
          <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
              <p class="text-red-800">{{ error }}</p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button type="button" 
                    (click)="goBack()"
                    class="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Annuler
            </button>
            <button type="submit" 
                    [disabled]="classeForm.invalid || isLoading"
                    class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              <div *ngIf="isLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {{ isLoading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer la classe') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ClasseFormComponent implements OnInit {
  classeForm: FormGroup;
  isEditing = false;
  isLoading = false;
  error: string | null = null;
  classeId: number | null = null;

  currentClasse: Classe | null = null;
  availableTeachers: User[] = [];
  niveauxScolaires = NIVEAUX_SCOLAIRES;

  constructor(
    private fb: FormBuilder,
    private classeService: ClasseService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    this.classeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(100)]],
      niveau: ['', Validators.required],
      section: ['', Validators.maxLength(10)],
      effectif_max: ['', [Validators.required, Validators.min(1), Validators.max(50)]],
      description: [''],
      actif: [true],
      selectedTeacher: ['']
    });
  }

  ngOnInit(): void {
    this.checkEditMode();
    this.loadAvailableTeachers();
  }

  /**
   * Check if we're in edit mode
   */
  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.classeId = +id;
      this.loadClasse();
    }
  }

  /**
   * Load classe data for editing
   */
  private loadClasse(): void {
    if (!this.classeId) return;

    this.isLoading = true;
    this.classeService.getClasseById(this.classeId).subscribe({
      next: (classe) => {
        this.currentClasse = classe;
        this.populateForm(classe);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la classe:', error);
        this.error = 'Impossible de charger les données de la classe';
        this.isLoading = false;
      }
    });
  }

  /**
   * Load available teachers
   */
  private loadAvailableTeachers(): void {
    this.userService.getUsers({ role: 'enseignant', actif: true }).subscribe({
      next: (response) => {
        this.availableTeachers = response.data.filter(teacher => 
          !this.currentClasse?.enseignants?.some(assigned => assigned.id === teacher.id)
        );
      },
      error: (error) => {
        console.error('Erreur lors du chargement des enseignants:', error);
      }
    });
  }

  /**
   * Populate form with classe data
   */
  private populateForm(classe: Classe): void {
    this.classeForm.patchValue({
      nom: classe.nom,
      niveau: classe.niveau,
      section: classe.section || '',
      effectif_max: classe.effectif_max,
      description: classe.description || '',
      actif: classe.active
    });
  }

  /**
   * Add teacher to classe
   */
  addTeacher(): void {
    const teacherId = this.classeForm.get('selectedTeacher')?.value;
    if (!teacherId || !this.classeId) return;

    this.classeService.affecterEnseignant(this.classeId, { enseignant_id: teacherId }).subscribe({
      next: () => {
        this.notificationService.success('Enseignant ajouté', 'L\'enseignant a été affecté à la classe avec succès');
        this.classeForm.patchValue({ selectedTeacher: '' });
        this.loadClasse(); // Reload to get updated teacher list
        this.loadAvailableTeachers();
      },
      error: (error) => {
        console.error('Erreur lors de l\'affectation:', error);
        this.notificationService.error('Erreur', 'Impossible d\'affecter l\'enseignant à la classe');
      }
    });
  }

  /**
   * Remove teacher from classe
   */
  removeTeacher(teacherId: number): void {
    if (!this.classeId) return;

    if (confirm('Êtes-vous sûr de vouloir retirer cet enseignant de la classe ?')) {
      this.classeService.retirerEnseignant(this.classeId, teacherId).subscribe({
        next: () => {
          this.notificationService.success('Enseignant retiré', 'L\'enseignant a été retiré de la classe avec succès');
          this.loadClasse(); // Reload to get updated teacher list
          this.loadAvailableTeachers();
        },
        error: (error) => {
          console.error('Erreur lors du retrait:', error);
          this.notificationService.error('Erreur', 'Impossible de retirer l\'enseignant de la classe');
        }
      });
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.classeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const formData = { ...this.classeForm.value };
    delete formData.selectedTeacher; // Remove helper field

    if (this.isEditing && this.classeId) {
      this.updateClasse(formData);
    } else {
      this.createClasse(formData);
    }
  }

  /**
   * Create new classe
   */
  private createClasse(data: CreateClasseRequest): void {
    this.classeService.createClasse(data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (classe) => {
          this.notificationService.success('Classe créée', `La classe "${classe.nom}" a été créée avec succès`);
          this.router.navigate(['/admin/classes']);
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.handleFormError(error);
        }
      });
  }

  /**
   * Update existing classe
   */
  private updateClasse(data: UpdateClasseRequest): void {
    if (!this.classeId) return;

    this.classeService.updateClasse(this.classeId, data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (classe) => {
          this.notificationService.success('Classe modifiée', `La classe "${classe.nom}" a été modifiée avec succès`);
          this.router.navigate(['/admin/classes']);
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.handleFormError(error);
        }
      });
  }

  /**
   * Handle form errors
   */
  private handleFormError(error: any): void {
    if (error.status === 422 && error.error?.erreurs) {
      // Handle validation errors
      const errors = error.error.erreurs;
      Object.keys(errors).forEach(field => {
        const control = this.classeForm.get(field);
        if (control) {
          control.setErrors({ server: errors[field][0] });
        }
      });
      this.error = 'Veuillez corriger les erreurs dans le formulaire';
    } else if (error.status === 409) {
      this.error = 'Une classe avec ce nom existe déjà pour ce niveau';
    } else {
      this.error = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
    }
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.classeForm.controls).forEach(key => {
      const control = this.classeForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Navigate back to classe list
   */
  goBack(): void {
    this.router.navigate(['/admin/classes']);
  }
}