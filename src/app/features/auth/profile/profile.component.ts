import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User, ChangePasswordRequest } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Mon profil</h1>
            <p class="text-gray-600 mt-2">Gérez vos informations personnelles et paramètres de compte</p>
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

      <div class="max-w-4xl mx-auto space-y-8">
        <!-- Profile Overview -->
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600">
            <div class="flex items-center">
              <div class="h-20 w-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span class="text-2xl font-bold text-white" *ngIf="currentUser">
                  {{ currentUser.nom.charAt(0) }}{{ currentUser.prenom.charAt(0) }}
                </span>
              </div>
              <div class="ml-6 text-white">
                <h2 class="text-2xl font-bold" *ngIf="currentUser">
                  {{ currentUser.nom }} {{ currentUser.prenom }}
                </h2>
                <p class="text-blue-100 capitalize">{{ getRoleLabel() }}</p>
                <p class="text-blue-100 text-sm" *ngIf="currentUser?.identifiant_genere">
                  ID: {{ currentUser.identifiant_genere }}
                </p>
              </div>
            </div>
          </div>

          <!-- Account Status -->
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Statut du compte</h3>
                <p class="text-sm text-gray-600">Informations sur l'état de votre compte</p>
              </div>
              <div class="flex items-center space-x-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-green-100 text-green-800': currentUser?.actif,
                        'bg-red-100 text-red-800': !currentUser?.actif
                      }">
                  <span class="w-1.5 h-1.5 mr-1.5 rounded-full"
                        [ngClass]="{
                          'bg-green-400': currentUser?.actif,
                          'bg-red-400': !currentUser?.actif
                        }"></span>
                  {{ currentUser?.actif ? 'Compte actif' : 'Compte inactif' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Account Info -->
          <div class="px-6 py-4">
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-600">Email</dt>
                <dd class="text-sm text-gray-900 mt-1">{{ currentUser?.email }}</dd>
              </div>
              <div *ngIf="currentUser?.telephone">
                <dt class="text-sm font-medium text-gray-600">Téléphone</dt>
                <dd class="text-sm text-gray-900 mt-1">{{ currentUser.telephone }}</dd>
              </div>
              <div *ngIf="currentUser?.date_naissance">
                <dt class="text-sm font-medium text-gray-600">Date de naissance</dt>
                <dd class="text-sm text-gray-900 mt-1">{{ currentUser.date_naissance | date:'dd/MM/yyyy' }}</dd>
              </div>
              <div *ngIf="currentUser?.adresse">
                <dt class="text-sm font-medium text-gray-600">Adresse</dt>
                <dd class="text-sm text-gray-900 mt-1">{{ currentUser.adresse }}</dd>
              </div>
              <div *ngIf="currentUser?.created_at">
                <dt class="text-sm font-medium text-gray-600">Membre depuis</dt>
                <dd class="text-sm text-gray-900 mt-1">{{ currentUser.created_at | date:'dd/MM/yyyy' }}</dd>
              </div>
              <div *ngIf="currentUser?.updated_at">
                <dt class="text-sm font-medium text-gray-600">Dernière modification</dt>
                <dd class="text-sm text-gray-900 mt-1">{{ currentUser.updated_at | date:'dd/MM/yyyy à HH:mm' }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Change Password Form -->
        <div class="bg-white shadow-sm rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            Changer le mot de passe
          </h3>

          <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-6">
            <!-- Current Password -->
            <div>
              <label for="current_password" class="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe actuel <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input type="password" 
                       id="current_password"
                       formControlName="ancien_mot_de_passe"
                       placeholder="Votre mot de passe actuel"
                       [class.border-red-300]="passwordForm.get('ancien_mot_de_passe')?.invalid && passwordForm.get('ancien_mot_de_passe')?.touched"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div *ngIf="passwordForm.get('ancien_mot_de_passe')?.invalid && passwordForm.get('ancien_mot_de_passe')?.touched" 
                   class="mt-1 text-sm text-red-600">
                Le mot de passe actuel est requis
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label for="new_password" class="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input type="password" 
                       id="new_password"
                       formControlName="nouveau_mot_de_passe"
                       placeholder="Votre nouveau mot de passe"
                       [class.border-red-300]="passwordForm.get('nouveau_mot_de_passe')?.invalid && passwordForm.get('nouveau_mot_de_passe')?.touched"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div *ngIf="passwordForm.get('nouveau_mot_de_passe')?.invalid && passwordForm.get('nouveau_mot_de_passe')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <span *ngIf="passwordForm.get('nouveau_mot_de_passe')?.errors?.['required']">
                  Le nouveau mot de passe est requis
                </span>
                <span *ngIf="passwordForm.get('nouveau_mot_de_passe')?.errors?.['minlength']">
                  Le mot de passe doit contenir au moins 8 caractères
                </span>
                <span *ngIf="passwordForm.get('nouveau_mot_de_passe')?.errors?.['pattern']">
                  Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre
                </span>
              </div>

              <!-- Password Strength Indicator -->
              <div class="mt-2">
                <div class="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Force du mot de passe</span>
                  <span class="capitalize" [ngClass]="{
                    'text-red-600': getPasswordStrength() === 'faible',
                    'text-yellow-600': getPasswordStrength() === 'moyen',
                    'text-green-600': getPasswordStrength() === 'fort'
                  }">{{ getPasswordStrength() }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div [class]="getPasswordStrengthClass()" 
                       [style.width.%]="getPasswordStrengthPercentage()"
                       class="h-2 rounded-full transition-all duration-300"></div>
                </div>
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le nouveau mot de passe <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input type="password" 
                       id="confirm_password"
                       formControlName="nouveau_mot_de_passe_confirmation"
                       placeholder="Confirmez votre nouveau mot de passe"
                       [class.border-red-300]="passwordForm.get('nouveau_mot_de_passe_confirmation')?.invalid && passwordForm.get('nouveau_mot_de_passe_confirmation')?.touched"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div *ngIf="passwordForm.get('nouveau_mot_de_passe_confirmation')?.invalid && passwordForm.get('nouveau_mot_de_passe_confirmation')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <span *ngIf="passwordForm.get('nouveau_mot_de_passe_confirmation')?.errors?.['required']">
                  La confirmation du mot de passe est requise
                </span>
                <span *ngIf="passwordForm.get('nouveau_mot_de_passe_confirmation')?.errors?.['mismatch']">
                  Les mots de passe ne correspondent pas
                </span>
              </div>
            </div>

            <!-- Password Guidelines -->
            <div class="bg-blue-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 mb-2">Critères pour un mot de passe sécurisé :</h4>
              <ul class="text-sm text-blue-800 space-y-1">
                <li class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Au moins 8 caractères
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Au moins une lettre majuscule
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Au moins une lettre minuscule
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  Au moins un chiffre
                </li>
              </ul>
            </div>

            <!-- Error Display -->
            <div *ngIf="passwordError" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex">
                <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
                <p class="text-red-800">{{ passwordError }}</p>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
              <button type="submit" 
                      [disabled]="passwordForm.invalid || isChangingPassword"
                      class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                <div *ngIf="isChangingPassword" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ isChangingPassword ? 'Modification...' : 'Changer le mot de passe' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Security Notice -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div class="flex">
            <svg class="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <div>
              <h3 class="text-sm font-medium text-yellow-800">Sécurité de votre compte</h3>
              <div class="mt-2 text-sm text-yellow-700">
                <ul class="list-disc pl-5 space-y-1">
                  <li>Ne partagez jamais vos identifiants de connexion avec personne</li>
                  <li>Changez votre mot de passe régulièrement</li>
                  <li>Déconnectez-vous toujours après utilisation sur un ordinateur partagé</li>
                  <li>Contactez l'administration en cas de problème avec votre compte</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  passwordForm: FormGroup;
  isChangingPassword = false;
  passwordError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      ancien_mot_de_passe: ['', Validators.required],
      nouveau_mot_de_passe: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      nouveau_mot_de_passe_confirmation: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  /**
   * Load current user
   */
  private loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Custom validator for password match
   */
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('nouveau_mot_de_passe');
    const confirmPassword = form.get('nouveau_mot_de_passe_confirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else if (confirmPassword?.errors?.['mismatch']) {
      delete confirmPassword.errors['mismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  /**
   * Get password strength
   */
  getPasswordStrength(): string {
    const password = this.passwordForm.get('nouveau_mot_de_passe')?.value || '';
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score < 3) return 'faible';
    if (score < 5) return 'moyen';
    return 'fort';
  }

  /**
   * Get password strength percentage
   */
  getPasswordStrengthPercentage(): number {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'faible': return 33;
      case 'moyen': return 66;
      case 'fort': return 100;
      default: return 0;
    }
  }

  /**
   * Get password strength CSS class
   */
  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'faible': return 'bg-red-500';
      case 'moyen': return 'bg-yellow-500';
      case 'fort': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  }

  /**
   * Get role label
   */
  getRoleLabel(): string {
    if (!this.currentUser) return '';
    
    const roleLabels = {
      'administrateur': 'Administrateur',
      'enseignant': 'Enseignant',
      'eleve': 'Élève'
    };
    
    return roleLabels[this.currentUser.role as keyof typeof roleLabels] || this.currentUser.role;
  }

  /**
   * Handle password change
   */
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = null;

    const changePasswordRequest: ChangePasswordRequest = this.passwordForm.value;

    this.authService.changePassword(changePasswordRequest)
      .pipe(finalize(() => this.isChangingPassword = false))
      .subscribe({
        next: () => {
          this.notificationService.success(
            'Mot de passe modifié', 
            'Votre mot de passe a été modifié avec succès'
          );
          this.passwordForm.reset();
        },
        error: (error) => {
          console.error('Erreur lors du changement de mot de passe:', error);
          this.handlePasswordError(error);
        }
      });
  }

  /**
   * Handle password change errors
   */
  private handlePasswordError(error: any): void {
    if (error.status === 401) {
      this.passwordError = 'Le mot de passe actuel est incorrect';
    } else if (error.status === 422 && error.error?.erreurs) {
      const errors = error.error.erreurs;
      this.passwordError = Object.values(errors).flat().join(', ');
    } else {
      this.passwordError = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
    }
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Navigate back
   */
  goBack(): void {
    if (this.currentUser?.role === 'administrateur') {
      this.router.navigate(['/admin/dashboard']);
    } else if (this.currentUser?.role === 'enseignant') {
      this.router.navigate(['/enseignant/dashboard']);
    } else {
      this.router.navigate(['/eleve/dashboard']);
    }
  }
}