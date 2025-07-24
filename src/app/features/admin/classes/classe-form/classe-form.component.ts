import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ClasseService } from '../../../../core/services/classe.service';
import { UserService } from '../../../../core/services/user.service';
import { 
  Classe, 
  CreateClasseRequest,
  UpdateClasseRequest,
  ClasseFormErrors,
  NIVEAUX_DISPONIBLES,
  SECTIONS_DISPONIBLES
} from '../../../../shared/models/classe.model';
import { Enseignant } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-classe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './classe-form.component.html',
  styleUrl: './classe-form.component.css'
})
export class ClasseFormComponent implements OnInit {
  // État du formulaire
  classeForm: FormGroup;
  isLoading = false;
  isEditing = false;
  classeId: number | null = null;
  error: string | null = null;
  success: string | null = null;
  
  // Données
  currentClasse: Classe | null = null;
  availableEnseignants: Enseignant[] = [];
  selectedEnseignants: number[] = [];
  
  // Configuration
  niveauxDisponibles = NIVEAUX_DISPONIBLES;
  sectionsDisponibles = SECTIONS_DISPONIBLES;
  
  // Erreurs de validation
  formErrors: ClasseFormErrors = {};

  constructor(
    private formBuilder: FormBuilder,
    private classeService: ClasseService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.classeForm = this.createForm();
  }

  ngOnInit(): void {
    // Vérifier si on est en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.classeId = +params['id'];
        this.isEditing = true;
        this.loadClasse();
      }
    });

    // Charger les enseignants disponibles
    this.loadEnseignants();
    
    // Observer les changements niveau/section pour générer le nom
    this.setupNameGeneration();
  }

  /**
   * Créer le formulaire avec validations
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      niveau: ['', Validators.required],
      section: ['', Validators.required],
      effectif_max: [30, [Validators.required, Validators.min(1), Validators.max(100)]],
      description: [''],
      auto_generate_name: [true] // Option pour générer automatiquement le nom
    });
  }

  /**
   * Configuration de la génération automatique du nom
   */
  private setupNameGeneration(): void {
    // Observer les changements de niveau et section
    this.classeForm.get('niveau')?.valueChanges.subscribe(() => {
      this.generateNameIfAuto();
    });
    
    this.classeForm.get('section')?.valueChanges.subscribe(() => {
      this.generateNameIfAuto();
    });
    
    this.classeForm.get('auto_generate_name')?.valueChanges.subscribe((auto: boolean) => {
      if (auto) {
        this.generateNameIfAuto();
      }
    });
  }

  /**
   * Générer le nom automatiquement si l'option est activée
   */
  private generateNameIfAuto(): void {
    if (this.classeForm.get('auto_generate_name')?.value) {
      const niveau = this.classeForm.get('niveau')?.value;
      const section = this.classeForm.get('section')?.value;
      
      if (niveau && section) {
        const nom = `${niveau} ${section}`;
        this.classeForm.get('nom')?.setValue(nom);
      }
    }
  }

  /**
   * Charger les enseignants disponibles
   */
  private loadEnseignants(): void {
    this.userService.searchUsers('', 'enseignant').subscribe({
      next: (enseignants) => {
        this.availableEnseignants = enseignants as Enseignant[];
        console.log('👨‍🏫 Enseignants chargés:', this.availableEnseignants.length);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des enseignants:', error);
      }
    });
  }

  /**
   * Charger une classe existante (mode édition)
   */
  private loadClasse(): void {
    if (!this.classeId) return;
    
    this.isLoading = true;
    this.classeService.getClasseById(this.classeId).subscribe({
      next: (classe) => {
        this.currentClasse = classe;
        this.populateForm(classe);
        this.selectedEnseignants = classe.enseignants?.map(e => e.id) || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement de la classe:', error);
        this.error = 'Erreur lors du chargement de la classe';
        this.isLoading = false;
      }
    });
  }

  /**
   * Remplir le formulaire avec les données de la classe
   */
  private populateForm(classe: Classe): void {
    this.classeForm.patchValue({
      nom: classe.nom,
      niveau: classe.niveau,
      section: classe.section,
      effectif_max: classe.effectif_max,
      description: classe.description,
      auto_generate_name: false // Désactiver la génération auto en édition
    });
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.classeForm.invalid || this.isLoading) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.success = null;
    this.formErrors = {};

    const formData = this.classeForm.value;

    if (this.isEditing) {
      this.updateClasse(formData);
    } else {
      this.createClasse(formData);
    }
  }

  /**
   * Créer une nouvelle classe
   */
  private createClasse(formData: any): void {
    const classeData: CreateClasseRequest = {
      nom: formData.nom,
      niveau: formData.niveau,
      section: formData.section,
      effectif_max: formData.effectif_max,
      description: formData.description
    };

    this.classeService.createClasse(classeData).subscribe({
      next: (classe) => this.handleCreateSuccess(classe),
      error: (error) => this.handleError(error)
    });
  }

  /**
   * Mettre à jour une classe existante
   */
  private updateClasse(formData: any): void {
    if (!this.classeId) return;

    const updateData: UpdateClasseRequest = {
      nom: formData.nom,
      niveau: formData.niveau,
      section: formData.section,
      effectif_max: formData.effectif_max,
      description: formData.description
    };

    this.classeService.updateClasse(this.classeId, updateData).subscribe({
      next: (classe) => this.handleUpdateSuccess(classe),
      error: (error) => this.handleError(error)
    });
  }

  /**
   * Gérer le succès de création
   */
  private handleCreateSuccess(classe: Classe): void {
    this.isLoading = false;
    this.success = `Classe ${classe.nom} créée avec succès !`;
    
    // Affecter les enseignants si sélectionnés
    if (this.selectedEnseignants.length > 0) {
      this.affecterEnseignants(classe.id);
    } else {
      // Rediriger après 2 secondes
      setTimeout(() => {
        this.router.navigate(['/admin/classes']);
      }, 2000);
    }
  }

  /**
   * Gérer le succès de mise à jour
   */
  private handleUpdateSuccess(classe: Classe): void {
    this.isLoading = false;
    this.success = `Classe ${classe.nom} mise à jour avec succès !`;
    
    // Gérer les changements d'affectation d'enseignants
    this.updateEnseignantAffectations(classe.id);
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
   * Affecter les enseignants sélectionnés
   */
  private affecterEnseignants(classeId: number): void {
    const affectations = this.selectedEnseignants.map(enseignantId => 
      this.classeService.affecterEnseignant(classeId, enseignantId)
    );

    Promise.all(affectations).then(() => {
      console.log('👨‍🏫 Enseignants affectés avec succès');
      setTimeout(() => {
        this.router.navigate(['/admin/classes']);
      }, 2000);
    }).catch(error => {
      console.error('❌ Erreur lors de l\'affectation:', error);
    });
  }

  /**
   * Mettre à jour les affectations d'enseignants (mode édition)
   */
  private updateEnseignantAffectations(classeId: number): void {
    // Logique pour gérer les ajouts/suppressions d'enseignants
    // Pour simplifier, on redirige directement
    setTimeout(() => {
      this.router.navigate(['/admin/classes']);
    }, 2000);
  }

  /**
   * Gestion de la sélection des enseignants
   */
  toggleEnseignantSelection(enseignantId: number): void {
    const index = this.selectedEnseignants.indexOf(enseignantId);
    if (index > -1) {
      this.selectedEnseignants.splice(index, 1);
    } else {
      this.selectedEnseignants.push(enseignantId);
    }
  }

  isEnseignantSelected(enseignantId: number): boolean {
    return this.selectedEnseignants.includes(enseignantId);
  }

  /**
   * Marquer tous les champs comme touchés
   */
  private markFormGroupTouched(): void {
    Object.keys(this.classeForm.controls).forEach(key => {
      this.classeForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Vérifier si un champ a une erreur
   */
  hasError(fieldName: string): boolean {
    const field = this.classeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtenir le message d'erreur d'un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.classeForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return 'Ce champ est obligatoire';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
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
    this.router.navigate(['/admin/classes']);
  }

  /**
   * Prévisualiser les données avant soumission
   */
  previewData(): void {
    console.log('📋 Données du formulaire:', this.classeForm.value);
    console.log('👨‍🏫 Enseignants sélectionnés:', this.selectedEnseignants);
  }

  /**
   * Calculer l'effectif recommandé selon le niveau
   */
  getEffectifRecommande(): number {
    const niveau = this.classeForm.get('niveau')?.value;
    
    // Effectifs recommandés par niveau
    const effectifsRecommandes: Record<string, number> = {
      '6ème': 28,
      '5ème': 28,
      '4ème': 30,
      '3ème': 30,
      '2nde': 35,
      '1ère': 32,
      'Terminale': 30
    };
    
    return effectifsRecommandes[niveau] || 30;
  }

  /**
   * Appliquer l'effectif recommandé
   */
  applyRecommendedEffectif(): void {
    const recommended = this.getEffectifRecommande();
    this.classeForm.get('effectif_max')?.setValue(recommended);
  }

  /**
   * Vérifier la disponibilité du nom de classe
   */
  checkNomDisponibilite(): void {
    const nom = this.classeForm.get('nom')?.value;
    if (nom && nom.length >= 2) {
      // TODO: Implémenter la vérification côté serveur
      console.log('🔍 Vérification disponibilité:', nom);
    }
  }
}