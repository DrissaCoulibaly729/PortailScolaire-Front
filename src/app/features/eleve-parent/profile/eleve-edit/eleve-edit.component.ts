// src/app/features/eleve-parent/profile/eleve-edit.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EleveParentService } from '../../../core/services/eleve-parent.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

import { Eleve } from '../../../shared/models/user.model';

@Component({
  selector: 'app-eleve-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './eleve-edit.component.html',
  styleUrls: ['./eleve-edit.component.css']
})
export class EleveEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // État du composant
  editForm: FormGroup;
  eleve: Eleve | null = null;
  isLoading = true;
  isSaving = false;
  error = '';

  // Validation
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  phonePattern = /^(\+33|0)[1-9](\d{8})$/;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private eleveParentService: EleveParentService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.editForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadEleveDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Créer le formulaire de modification
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      // Informations personnelles (certaines peuvent être non modifiables)
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      telephone: ['', [Validators.pattern(this.phonePattern)]],
      adresse: [''],
      
      // Informations parent (modifiables par le parent)
      nom_parent: ['', [Validators.required, Validators.minLength(2)]],
      prenom_parent: ['', [Validators.required, Validators.minLength(2)]],
      email_parent: ['', [Validators.required, Validators.email]],
      telephone_parent: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
    });
  }

  /**
   * Charger les détails de l'élève
   */
  private loadEleveDetails(): void {
    this.isLoading = true;
    this.error = '';

    this.eleveParentService.getEleveDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.allowed && response.data) {
            this.eleve = response.data;
            this.populateForm();
          } else {
            this.error = response.reason || 'Accès non autorisé';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement:', error);
          this.error = 'Erreur lors du chargement des informations';
          this.isLoading = false;
        }
      });
  }

  /**
   * Remplir le formulaire avec les données existantes
   */
  private populateForm(): void {
    if (!this.eleve) return;

    this.editForm.patchValue({
      nom: this.eleve.nom,
      prenom: this.eleve.prenom,
      email: this.eleve.email,
      telephone: this.eleve.telephone,
      adresse: this.eleve.adresse,
      nom_parent: this.eleve.nom_parent,
      prenom_parent: this.eleve.prenom_parent,
      email_parent: this.eleve.email_parent,
      telephone_parent: this.eleve.telephone_parent
    });

    // Désactiver les champs que l'élève/parent ne peut pas modifier
    this.editForm.get('nom')?.disable();
    this.editForm.get('prenom')?.disable();
  }

  /**
   * Soumettre le formulaire
   */
  onSubmit(): void {
    if (this.editForm.invalid || !this.eleve) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving = true;
    const formData = this.editForm.value;

    // Préparer seulement les données que le parent peut modifier
    const updateData = {
      email: formData.email,
      telephone: formData.telephone,
      adresse: formData.adresse,
      nom_parent: formData.nom_parent,
      prenom_parent: formData.prenom_parent,
      email_parent: formData.email_parent,
      telephone_parent: formData.telephone_parent
    };

    this.eleveParentService.updateInformationsParent(this.eleve.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedEleve) => {
          this.eleve = updatedEleve;
          this.notificationService.success('Succès', 'Informations mises à jour avec succès');
          this.router.navigate(['/eleve/profile']);
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde:', error);
          this.notificationService.error('Erreur', 'Échec de la mise à jour des informations');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
  }

  /**
   * Annuler les modifications
   */
  onCancel(): void {
    if (this.editForm.dirty) {
      if (confirm('Voulez-vous vraiment annuler vos modifications ?')) {
        this.router.navigate(['/eleve/profile']);
      }
    } else {
      this.router.navigate(['/eleve/profile']);
    }
  }

  /**
   * Marquer tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(): void {
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      if (control && control.enabled) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Vérifier si un champ a une erreur
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtenir le message d'erreur pour un champ
   */
  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return 'Ce champ est obligatoire';
    if (errors['email']) return 'Format d\'email invalide';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['pattern']) {
      if (fieldName.includes('telephone')) return 'Format de téléphone invalide (ex: 0123456789)';
      return 'Format invalide';
    }

    return 'Champ invalide';
  }

  /**
   * Vérifier si le formulaire peut être soumis
   */
  canSubmit(): boolean {
    return this.editForm.valid && !this.isSaving;
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm(): void {
    if (confirm('Voulez-vous vraiment réinitialiser le formulaire ?')) {
      this.populateForm();
      this.editForm.markAsUntouched();
    }
  }

  /**
   * Formater le numéro de téléphone en temps réel
   */
  formatPhoneNumber(event: any, fieldName: string): void {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.startsWith('33')) {
      value = '+' + value;
    } else if (value.length === 10 && value.startsWith('0')) {
      // Format français standard
      value = value.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    
    this.editForm.get(fieldName)?.setValue(value);
  }

  /**
   * Validation en temps réel de l'email
   */
  validateEmail(fieldName: string): void {
    const emailField = this.editForm.get(fieldName);
    if (emailField && emailField.value) {
      const isValid = this.emailPattern.test(emailField.value);
      if (!isValid && emailField.value.length > 0) {
        emailField.setErrors({ 'email': true });
      }
    }
  }
}