import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatiereService } from '../../../../core/services/matiere.service';
import { 
  Matiere, 
  CreateMatiereRequest,
  UpdateMatiereRequest,
  MatiereFormErrors,
  MATIERES_COMMUNES
} from '../../../../shared/models/matiere.model';

@Component({
  selector: 'app-matiere-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './matiere-form.component.html',
  styleUrl: './matiere-form.component.css'
})
export class MatiereFormComponent implements OnInit {
  // État du formulaire
  matiereForm: FormGroup;
  isLoading = false;
  isEditing = false;
  matiereId: number | null = null;
  error: string | null = null;
  success: string | null = null;
  
  // Données
  currentMatiere: Matiere | null = null;
  matieresCommunes = MATIERES_COMMUNES;
  
  // Erreurs de validation
  formErrors: MatiereFormErrors = {};

  constructor(
    private formBuilder: FormBuilder,
    private matiereService: MatiereService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.matiereForm = this.createForm();
  }

  ngOnInit(): void {
    // Vérifier si on est en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.matiereId = +params['id'];
        this.isEditing = true;
        this.loadMatiere();
      }
    });

    // Observer les changements de nom pour générer le code
    this.setupCodeGeneration();
  }

  /**
   * Créer le formulaire avec validations
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      coefficient: [1.0, [Validators.required, Validators.min(0.5), Validators.max(5.0)]],
      description: [''],
      auto_generate_code: [true]
    });
  }

  /**
   * Configuration de la génération automatique du code
   */
  private setupCodeGeneration(): void {
    this.matiereForm.get('nom')?.valueChanges.subscribe((nom: string) => {
      if (this.matiereForm.get('auto_generate_code')?.value && nom) {
        const code = this.matiereService.generateMatiereCode(nom);
        this.matiereForm.get('code')?.setValue(code);
      }
    });

    this.matiereForm.get('auto_generate_code')?.valueChanges.subscribe((auto: boolean) => {
      if (auto) {
        const nom = this.matiereForm.get('nom')?.value;
        if (nom) {
          const code = this.matiereService.generateMatiereCode(nom);
          this.matiereForm.get('code')?.setValue(code);
        }
      }
    });
  }

  /**
   * Charger une matière existante (mode édition)
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
        console.error('❌ Erreur lors du chargement de la matière:', error);
        this.error = 'Erreur lors du chargement de la matière';
        this.isLoading = false;
      }
    });
  }

  /**
   * Remplir le formulaire avec les données de la matière
   */
  private populateForm(matiere: Matiere): void {
    this.matiereForm.patchValue({
      nom: matiere.nom,
      code: matiere.code,
      coefficient: matiere.coefficient,
      description: matiere.description,
      auto_generate_code: false // Désactiver la génération auto en édition
    });
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.matiereForm.invalid || this.isLoading) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.success = null;
    this.formErrors = {};

    const formData = this.matiereForm.value;

    if (this.isEditing) {
      this.updateMatiere(formData);
    } else {
      this.createMatiere(formData);
    }
  }

  /**
   * Créer une nouvelle matière
   */
  private createMatiere(formData: any): void {
    const matiereData: CreateMatiereRequest = {
      nom: formData.nom,
      code: formData.code,
      coefficient: formData.coefficient,
      description: formData.description
    };

    this.matiereService.createMatiere(matiereData).subscribe({
      next: (matiere) => this.handleCreateSuccess(matiere),
      error: (error) => this.handleError(error)
    });
  }

  /**
   * Mettre à jour une matière existante
   */
  private updateMatiere(formData: any): void {
    if (!this.matiereId) return;

    const updateData: UpdateMatiereRequest = {
      nom: formData.nom,
      code: formData.code,
      coefficient: formData.coefficient,
      description: formData.description
    };

    this.matiereService.updateMatiere(this.matiereId, updateData).subscribe({
      next: (matiere) => this.handleUpdateSuccess(matiere),
      error: (error) => this.handleError(error)
    });
  }

  /**
   * Gérer le succès de création
   */
  private handleCreateSuccess(matiere: Matiere): void {
    this.isLoading = false;
    this.success = `Matière ${matiere.nom} créée avec succès !`;
    
    // Rediriger après 2 secondes
    setTimeout(() => {
      this.router.navigate(['/admin/matieres']);
    }, 2000);
  }

  /**
   * Gérer le succès de mise à jour
   */
  private handleUpdateSuccess(matiere: Matiere): void {
    this.isLoading = false;
    this.success = `Matière ${matiere.nom} mise à jour avec succès !`;
    
    setTimeout(() => {
      this.router.navigate(['/admin/matieres']);
    }, 2000);
  }

  /**
   * Gérer les erreurs
   */
  private handleError(error: any): void {
    this.isLoading = false;
    console.error('❌ Erreur:', error);
    
    if (error.status === 422 && error.error?.erreurs) {
      // Erreurs de validation
      this.formErrors = error.error.erreurs;
      this.error = 'Veuillez corriger les erreurs de validation';
    } else {
      this.error = error.message || 'Une erreur est survenue';
    }
  }

  /**
   * Appliquer une matière commune
   */
  applyMatiereCommune(matiere: any): void {
    this.matiereForm.patchValue({
      nom: matiere.nom,
      code: matiere.code,
      coefficient: matiere.coefficient,
      auto_generate_code: false
    });
  }

  /**
   * Marquer tous les champs comme touchés
   */
  private markFormGroupTouched(): void {
    Object.keys(this.matiereForm.controls).forEach(key => {
      this.matiereForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Vérifier si un champ a une erreur
   */
  hasError(fieldName: string): boolean {
    const field = this.matiereForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtenir le message d'erreur d'un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.matiereForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return 'Ce champ est obligatoire';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} caractères`;
    if (errors['min']) return `Valeur minimum: ${errors['min'].min}`;
    if (errors['max']) return `Valeur maximum: ${errors['max'].max}`;

    return 'Valeur invalide';
  }

  /**
   * Obtenir les erreurs de validation du serveur
   */
  getServerErrors(fieldName: string): string[] {
    return this.formErrors[fieldName] || [];
  }

  /**
   * Annuler et retourner à la liste
   */
  cancel(): void {
    this.router.navigate(['/admin/matieres']);
  }

  /**
   * Prévisualiser les données avant soumission
   */
  previewData(): void {
    console.log('📋 Données du formulaire:', this.matiereForm.value);
  }

  /**
   * Obtenir la couleur du coefficient
   */
  getCoefficientColor(): string {
    const coefficient = this.matiereForm.get('coefficient')?.value;
    return this.matiereService.getCoefficientColor(coefficient || 1);
  }

  /**
   * Obtenir l'importance de la matière
   */
  getImportanceLevel(): string {
    const coefficient = this.matiereForm.get('coefficient')?.value;
    return this.matiereService.getImportanceLevel(coefficient || 1);
  }
}