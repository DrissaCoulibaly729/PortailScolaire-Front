import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { MatiereService } from '../../../../core/services/matiere.service';
import { UserService } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { 
  Matiere, 
  CreateMatiereRequest, 
  UpdateMatiereRequest 
} from '../../../../shared/models/matiere.model';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-matiere-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ isEditing ? 'Modifier la matière' : 'Créer une nouvelle matière' }}
            </h1>
            <p class="text-gray-600 mt-2">
              {{ isEditing ? 'Modifiez les informations de la matière' : 'Remplissez les informations pour créer une nouvelle matière' }}
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
        <form [formGroup]="matiereForm" (ngSubmit)="onSubmit()" class="space-y-8">
          <!-- Basic Information -->
          <div class="bg-white shadow-sm rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              Informations générales
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Nom de la matière -->
              <div>
                <label for="nom" class="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la matière <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       id="nom"
                       formControlName="nom"
                       placeholder="Ex: Mathématiques, Français, Histoire..."
                       [class.border-red-300]="matiereForm.get('nom')?.invalid && matiereForm.get('nom')?.touched"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                <div *ngIf="matiereForm.get('nom')?.invalid && matiereForm.get('nom')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  <span *ngIf="matiereForm.get('nom')?.errors?.['required']">
                    Le nom de la matière est requis
                  </span>
                  <span *ngIf="matiereForm.get('nom')?.errors?.['maxlength']">
                    Le nom ne peut pas dépasser 100 caractères
                  </span>
                </div>
              </div>

              <!-- Code matière -->
              <div>
                <label for="code" class="block text-sm font-medium text-gray-700 mb-2">
                  Code matière <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       id="code"
                       formControlName="code"
                       placeholder="Ex: MATH, FR, HIST..."
                       [class.border-red-300]="matiereForm.get('code')?.invalid && matiereForm.get('code')?.touched"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono uppercase">
                <div *ngIf="matiereForm.get('code')?.invalid && matiereForm.get('code')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  <span *ngIf="matiereForm.get('code')?.errors?.['required']">
                    Le code matière est requis
                  </span>
                  <span *ngIf="matiereForm.get('code')?.errors?.['maxlength']">
                    Le code ne peut pas dépasser 10 caractères
                  </span>
                  <span *ngIf="matiereForm.get('code')?.errors?.['pattern']">
                    Le code doit contenir uniquement des lettres et chiffres
                  </span>
                </div>
                <p class="mt-1 text-xs text-gray-500">
                  Utilisez un code court et unique (lettres et chiffres uniquement)
                </p>
              </div>

              <!-- Coefficient -->
              <div class="md:col-span-2">
                <label for="coefficient" class="block text-sm font-medium text-gray-700 mb-2">
                  Coefficient <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input type="number" 
                         id="coefficient"
                         formControlName="coefficient"
                         min="0.5"
                         max="5"
                         step="0.5"
                         placeholder="2.0"
                         [class.border-red-300]="matiereForm.get('coefficient')?.invalid && matiereForm.get('coefficient')?.touched"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  
                  <!-- Coefficient Visual Indicator -->
                  <div class="mt-3">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Faible (0.5)</span>
                      <span>Élevé (5.0)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                           [style.width.%]="getCoefficientPercentage()"></div>
                    </div>
                    <div class="flex justify-center mt-2">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [ngClass]="{
                              'bg-gray-100 text-gray-800': getCoefficientLevel() === 'Très faible',
                              'bg-yellow-100 text-yellow-800': getCoefficientLevel() === 'Faible',
                              'bg-blue-100 text-blue-800': getCoefficientLevel() === 'Moyen',
                              'bg-orange-100 text-orange-800': getCoefficientLevel() === 'Élevé',
                              'bg-red-100 text-red-800': getCoefficientLevel() === 'Très élevé'
                            }">
                        {{ getCoefficientLevel() }}
                      </span>
                    </div>
                  </div>
                </div>
                <div *ngIf="matiereForm.get('coefficient')?.invalid && matiereForm.get('coefficient')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  <span *ngIf="matiereForm.get('coefficient')?.errors?.['required']">
                    Le coefficient est requis
                  </span>
                  <span *ngIf="matiereForm.get('coefficient')?.errors?.['min']">
                    Le coefficient minimum est 0.5
                  </span>
                  <span *ngIf="matiereForm.get('coefficient')?.errors?.['max']">
                    Le coefficient maximum est 5.0
                  </span>
                </div>
                <p class="mt-1 text-xs text-gray-500">
                  Le coefficient détermine l'importance de la matière dans le calcul de la moyenne générale
                </p>
              </div>
            </div>

            <!-- Description -->
            <div class="mt-6">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea id="description"
                        formControlName="description"
                        rows="4"
                        placeholder="Description détaillée de la matière, objectifs pédagogiques..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"></textarea>
              <div class="mt-1 text-xs text-gray-500">
                {{ (matiereForm.get('description')?.value || '').length }}/500 caractères
              </div>
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
            <div *ngIf="currentMatiere?.enseignants && currentMatiere.enseignants.length > 0" class="mb-6">
              <h4 class="text-sm font-medium text-gray-700 mb-3">Enseignants actuels</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div *ngFor="let enseignant of currentMatiere.enseignants" 
                     class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="flex items-center">
                    <div class="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-800">
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
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="">Sélectionnez un enseignant</option>
                  <option *ngFor="let teacher of availableTeachers" [value]="teacher.id">
                    {{ teacher.nom }} {{ teacher.prenom }} - {{ teacher.email }}
                  </option>
                </select>
                <button type="button" 
                        (click)="addTeacher()"
                        [disabled]="!matiereForm.get('selectedTeacher')?.value"
                        class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
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
                     class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
              <label for="active" class="ml-2 text-sm text-gray-700">
                Matière active
              </label>
            </div>
            <p class="mt-2 text-sm text-gray-500">
              Les matières inactives ne sont pas visibles pour la saisie de notes et les affectations d'enseignants.
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
                    class="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              Annuler
            </button>
            <button type="submit" 
                    [disabled]="matiereForm.invalid || isLoading"
                    class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              <div *ngIf="isLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {{ isLoading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer la matière') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class MatiereFormComponent implements OnInit {
  matiereForm: FormGroup;
  isEditing = false;
  isLoading = false;
  error: string | null = null;
  matiereId: number | null = null;

  currentMatiere: Matiere | null = null;
  availableTeachers: User[] = [];

  constructor(
    private fb: FormBuilder,
    private matiereService: MatiereService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    this.matiereForm = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [
        Validators.required, 
        Validators.maxLength(10),
        Validators.pattern(/^[A-Z0-9]+$/)
      ]],
      coefficient: ['', [
        Validators.required, 
        Validators.min(0.5), 
        Validators.max(5.0)
      ]],
      description: ['', Validators.maxLength(500)],
      actif: [true],
      selectedTeacher: ['']
    });

    // Auto-uppercase code field
    this.matiereForm.get('code')?.valueChanges.subscribe(value => {
      if (value) {
        this.matiereForm.get('code')?.setValue(value.toUpperCase(), { emitEvent: false });
      }
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
      this.matiereId = +id;
      this.loadMatiere();
    }
  }

  /**
   * Load matiere data for editing
   */
  private loadMatiere(): void {
    if (!this.matiereId) return;

    this.isLoading = true;
    this.matiereService.getMatiereById(this.matiereId).subscribe({
      next: (matiere) => {
        this.currentMatiere = matiere;
        this.populateForm(matiere);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la matière:', error);
        this.error = 'Impossible de charger les données de la matière';
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
          !this.currentMatiere?.enseignants?.some(assigned => assigned.id === teacher.id)
        );
      },
      error: (error) => {
        console.error('Erreur lors du chargement des enseignants:', error);
      }
    });
  }

  /**
   * Populate form with matiere data
   */
  private populateForm(matiere: Matiere): void {
    this.matiereForm.patchValue({
      nom: matiere.nom,
      code: matiere.code,
      coefficient: matiere.coefficient,
      description: matiere.description || '',
      actif: matiere.active
    });
  }

  /**
   * Get coefficient percentage for visual indicator
   */
  getCoefficientPercentage(): number {
    const coefficient = this.matiereForm.get('coefficient')?.value || 0;
    return Math.min(100, (coefficient / 5) * 100);
  }

  /**
   * Get coefficient level description
   */
  getCoefficientLevel(): string {
    const coefficient = this.matiereForm.get('coefficient')?.value || 0;
    if (coefficient <= 1) return 'Très faible';
    if (coefficient <= 2) return 'Faible';
    if (coefficient <= 3) return 'Moyen';
    if (coefficient <= 4) return 'Élevé';
    return 'Très élevé';
  }

  /**
   * Add teacher to matiere
   */
  addTeacher(): void {
    const teacherId = this.matiereForm.get('selectedTeacher')?.value;
    if (!teacherId || !this.matiereId) return;

    this.matiereService.affecterEnseignant(this.matiereId, { enseignant_id: teacherId }).subscribe({
      next: () => {
        this.notificationService.success('Enseignant ajouté', 'L\'enseignant a été affecté à la matière avec succès');
        this.matiereForm.patchValue({ selectedTeacher: '' });
        this.loadMatiere(); // Reload to get updated teacher list
        this.loadAvailableTeachers();
      },
      error: (error) => {
        console.error('Erreur lors de l\'affectation:', error);
        this.notificationService.error('Erreur', 'Impossible d\'affecter l\'enseignant à la matière');
      }
    });
  }

  /**
   * Remove teacher from matiere
   */
  removeTeacher(teacherId: number): void {
    if (!this.matiereId) return;

    if (confirm('Êtes-vous sûr de vouloir retirer cet enseignant de la matière ?')) {
      this.matiereService.retirerEnseignant(this.matiereId, teacherId).subscribe({
        next: () => {
          this.notificationService.success('Enseignant retiré', 'L\'enseignant a été retiré de la matière avec succès');
          this.loadMatiere(); // Reload to get updated teacher list
          this.loadAvailableTeachers();
        },
        error: (error) => {
          console.error('Erreur lors du retrait:', error);
          this.notificationService.error('Erreur', 'Impossible de retirer l\'enseignant de la matière');
        }
      });
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.matiereForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const formData = { ...this.matiereForm.value };
    delete formData.selectedTeacher; // Remove helper field

    if (this.isEditing && this.matiereId) {
      this.updateMatiere(formData);
    } else {
      this.createMatiere(formData);
    }
  }

  /**
   * Create new matiere
   */
  private createMatiere(data: CreateMatiereRequest): void {
    this.matiereService.createMatiere(data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (matiere) => {
          this.notificationService.success('Matière créée', `La matière "${matiere.nom}" a été créée avec succès`);
          this.router.navigate(['/admin/matieres']);
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.handleFormError(error);
        }
      });
  }

  /**
   * Update existing matiere
   */
  private updateMatiere(data: UpdateMatiereRequest): void {
    if (!this.matiereId) return;

    this.matiereService.updateMatiere(this.matiereId, data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (matiere) => {
          this.notificationService.success('Matière modifiée', `La matière "${matiere.nom}" a été modifiée avec succès`);
          this.router.navigate(['/admin/matieres']);
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
        const control = this.matiereForm.get(field);
        if (control) {
          control.setErrors({ server: errors[field][0] });
        }
      });
      this.error = 'Veuillez corriger les erreurs dans le formulaire';
    } else if (error.status === 409) {
      this.error = 'Une matière avec ce nom ou ce code existe déjà';
    } else {
      this.error = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
    }
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.matiereForm.controls).forEach(key => {
      const control = this.matiereForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Navigate back to matiere list
   */
  goBack(): void {
    this.router.navigate(['/admin/matieres']);
  }
}