
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { UserService } from '../../../../core/services/user.service';
import { 
  User, 
  UserRole, 
  USER_ROLES, 
  CreateEnseignantRequest,
  CreateEleveRequest,
  UpdateUserRequest,
  UserFormErrors,
  DOCUMENT_TYPES,
  DocumentType 
} from '../../../../shared/models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  // État du formulaire
  userForm: FormGroup;
  isLoading = false;
  isEditing = false;
  userId: number | null = null;
  error: string | null = null;
  success: string | null = null;
  
  // Données
  currentUser: User | null = null;
  availableRoles = USER_ROLES;
  availableClasses: any[] = []; // À charger depuis l'API
  availableMatieres: any[] = []; // À charger depuis l'API
  documentTypes = DOCUMENT_TYPES;
  
  // Upload de fichiers
  selectedFiles: { [key in DocumentType]?: File } = {};
  uploadProgress: { [key: string]: number } = {};
  
  // Erreurs de validation
  formErrors: UserFormErrors = {};
  
  // Configuration dynamique selon le rôle
  selectedRole: UserRole = 'eleve';
  showParentFields = false;
  showTeacherFields = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    // Vérifier si on est en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.userId = +params['id'];
        this.isEditing = true;
        this.loadUser();
      }
    });

    // Charger les données de référence
    this.loadReferenceData();
    
    // Observer les changements de rôle
    this.setupRoleObserver();
  }

  /**
   * Créer le formulaire avec validations
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      // Informations personnelles (obligatoires)
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      date_naissance: [''],
      adresse: [''],
      role: ['eleve', Validators.required],
      
      // Champs enseignant
      specialite: [''],
      diplomes: [''],
      experience_annees: [0, [Validators.min(0), Validators.max(50)]],
      matieres_ids: [[]],
      classes_ids: [[]],
      
      // Champs élève
      classe_id: [''],
      nom_parent: [''],
      prenom_parent: [''],
      telephone_parent: [''],
      email_parent: ['', Validators.email],
      adresse_parent: [''],
      profession_parent: ['']
    });
  }

  /**
   * Observer les changements de rôle pour adapter le formulaire
   */
  private setupRoleObserver(): void {
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      this.selectedRole = role;
      this.updateFormValidation(role);
      this.updateFieldsVisibility(role);
    });
  }

  /**
   * Mettre à jour la validation selon le rôle
   */
  private updateFormValidation(role: UserRole): void {
    // Réinitialiser toutes les validations spécifiques
    this.clearRoleSpecificValidations();
    
    if (role === 'eleve') {
      // Validations pour les élèves
      this.userForm.get('classe_id')?.setValidators([Validators.required]);
      this.userForm.get('nom_parent')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.userForm.get('prenom_parent')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.userForm.get('telephone_parent')?.setValidators([Validators.required]);
      this.userForm.get('email_parent')?.setValidators([Validators.required, Validators.email]);
    } else if (role === 'enseignant') {
      // Validations pour les enseignants
      this.userForm.get('specialite')?.setValidators([Validators.required]);
      this.userForm.get('diplomes')?.setValidators([Validators.required]);
    }
    
    // Mettre à jour la validation
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.updateValueAndValidity();
    });
  }

  /**
   * Supprimer les validations spécifiques aux rôles
   */
  private clearRoleSpecificValidations(): void {
    const roleSpecificFields = [
      'classe_id', 'nom_parent', 'prenom_parent', 'telephone_parent', 
      'email_parent', 'adresse_parent', 'profession_parent',
      'specialite', 'diplomes', 'experience_annees', 'matieres_ids', 'classes_ids'
    ];
    
    roleSpecificFields.forEach(field => {
      this.userForm.get(field)?.clearValidators();
      this.userForm.get(field)?.updateValueAndValidity();
    });
  }

  /**
   * Mettre à jour la visibilité des champs
   */
  private updateFieldsVisibility(role: UserRole): void {
    this.showParentFields = role === 'eleve';
    this.showTeacherFields = role === 'enseignant';
  }

  /**
   * Charger les données de référence (classes, matières)
   */
  private loadReferenceData(): void {
    // TODO: Charger les classes et matières depuis l'API
    this.availableClasses = [
      { id: 1, nom: '6ème A' },
      { id: 2, nom: '5ème B' },
      { id: 3, nom: '4ème C' }
    ];
    
    this.availableMatieres = [
      { id: 1, nom: 'Mathématiques' },
      { id: 2, nom: 'Français' },
      { id: 3, nom: 'Histoire-Géographie' }
    ];
  }

  /**
   * Charger un utilisateur existant (mode édition)
   */
  private loadUser(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.populateForm(user);
        this.selectedRole = user.role;
        this.updateFieldsVisibility(user.role);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
        this.error = 'Erreur lors du chargement de l\'utilisateur';
        this.isLoading = false;
      }
    });
  }

  /**
   * Remplir le formulaire avec les données utilisateur
   */
  private populateForm(user: User): void {
    this.userForm.patchValue({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      date_naissance: user.date_naissance,
      adresse: user.adresse,
      role: user.role
    });

    // Données spécifiques selon le rôle
    if (user.role === 'eleve') {
      const eleve = user as any; // Cast temporaire
      this.userForm.patchValue({
        classe_id: eleve.classe_id,
        nom_parent: eleve.nom_parent,
        prenom_parent: eleve.prenom_parent,
        telephone_parent: eleve.telephone_parent,
        email_parent: eleve.email_parent,
        adresse_parent: eleve.adresse_parent,
        profession_parent: eleve.profession_parent
      });
    } else if (user.role === 'enseignant') {
      const enseignant = user as any; // Cast temporaire
      this.userForm.patchValue({
        specialite: enseignant.specialite,
        diplomes: enseignant.diplomes,
        experience_annees: enseignant.experience_annees,
        matieres_ids: enseignant.matieres?.map((m: any) => m.id) || [],
        classes_ids: enseignant.classes?.map((c: any) => c.id) || []
      });
    }
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.userForm.invalid || this.isLoading) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.success = null;
    this.formErrors = {};

    const formData = this.userForm.value;

    if (this.isEditing) {
      this.updateUser(formData);
    } else {
      this.createUser(formData);
    }
  }

  /**
   * Créer un nouvel utilisateur
   */
  private createUser(formData: any): void {
    const { role } = formData;

    if (role === 'enseignant') {
      const enseignantData: CreateEnseignantRequest = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        date_naissance: formData.date_naissance,
        adresse: formData.adresse,
        specialite: formData.specialite,
        diplomes: formData.diplomes,
        experience_annees: formData.experience_annees,
        matieres_ids: formData.matieres_ids,
        classes_ids: formData.classes_ids
      };

      this.userService.createEnseignant(enseignantData).subscribe({
        next: (user) => this.handleCreateSuccess(user),
        error: (error) => this.handleError(error)
      });
      
    } else if (role === 'eleve') {
      const eleveData: CreateEleveRequest = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        date_naissance: formData.date_naissance,
        adresse: formData.adresse,
        classe_id: formData.classe_id,
        nom_parent: formData.nom_parent,
        prenom_parent: formData.prenom_parent,
        telephone_parent: formData.telephone_parent,
        email_parent: formData.email_parent,
        adresse_parent: formData.adresse_parent,
        profession_parent: formData.profession_parent
      };

      this.userService.createEleve(eleveData).subscribe({
        next: (user) => this.handleCreateSuccess(user),
        error: (error) => this.handleError(error)
      });
    }
  }

  /**
   * Mettre à jour un utilisateur existant
   */
  private updateUser(formData: any): void {
    if (!this.userId) return;

    const updateData: UpdateUserRequest = {
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      telephone: formData.telephone,
      date_naissance: formData.date_naissance,
      adresse: formData.adresse
    };

    // Ajouter les champs spécifiques selon le rôle
    if (formData.role === 'eleve') {
      Object.assign(updateData, {
        classe_id: formData.classe_id,
        nom_parent: formData.nom_parent,
        prenom_parent: formData.prenom_parent,
        telephone_parent: formData.telephone_parent,
        email_parent: formData.email_parent,
        adresse_parent: formData.adresse_parent,
        profession_parent: formData.profession_parent
      });
    } else if (formData.role === 'enseignant') {
      Object.assign(updateData, {
        specialite: formData.specialite,
        diplomes: formData.diplomes,
        experience_annees: formData.experience_annees
      });
    }

    this.userService.updateUser(this.userId, updateData).subscribe({
      next: (user) => this.handleUpdateSuccess(user),
      error: (error) => this.handleError(error)
    });
  }

  /**
   * Gérer le succès de création
   */
  private handleCreateSuccess(user: User): void {
    this.isLoading = false;
    this.success = `Utilisateur ${this.userService.getFullName(user)} créé avec succès !`;
    
    // Uploader les documents si nécessaire
    if (Object.keys(this.selectedFiles).length > 0) {
      this.uploadDocuments(user.id);
    } else {
      // Rediriger après 2 secondes
      setTimeout(() => {
        this.router.navigate(['/admin/users']);
      }, 2000);
    }
  }

  /**
   * Gérer le succès de mise à jour
   */
  private handleUpdateSuccess(user: User): void {
    this.isLoading = false;
    this.success = `Utilisateur ${this.userService.getFullName(user)} mis à jour avec succès !`;
    
    // Uploader les nouveaux documents si nécessaire
    if (Object.keys(this.selectedFiles).length > 0) {
      this.uploadDocuments(user.id);
    }
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
   * Upload des documents
   */
  private uploadDocuments(userId: number): void {
    const uploads = Object.entries(this.selectedFiles).map(([type, file]) => {
      return this.userService.uploadDocument(userId, file!, type as DocumentType);
    });

    // TODO: Gérer l'upload multiple avec progression
    Promise.all(uploads).then(() => {
      console.log('📎 Documents uploadés avec succès');
      setTimeout(() => {
        this.router.navigate(['/admin/users']);
      }, 2000);
    }).catch(error => {
      console.error('❌ Erreur lors de l\'upload:', error);
    });
  }

  /**
   * Sélection de fichier
   */
  onFileSelected(event: Event, documentType: DocumentType): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFiles[documentType] = input.files[0];
    }
  }

  /**
   * Supprimer un fichier sélectionné
   */
  removeSelectedFile(documentType: DocumentType): void {
    delete this.selectedFiles[documentType];
  }

  /**
   * Marquer tous les champs comme touchés
   */
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Vérifier si un champ a une erreur
   */
  hasError(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtenir le message d'erreur d'un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return 'Ce champ est obligatoire';
    if (errors['email']) return 'Format d\'email invalide';
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
    this.router.navigate(['/admin/users']);
  }

  /**
   * Générer un identifiant de connexion automatique
   */
  generateIdentifier(): void {
    const nom = this.userForm.get('nom')?.value;
    const prenom = this.userForm.get('prenom')?.value;
    
    if (nom && prenom) {
      const identifier = this.userService.generateLoginIdentifier(nom, prenom);
      console.log('🔑 Identifiant généré:', identifier);
      // Afficher l'identifiant à l'utilisateur
    }
  }

  /**
   * Prévisualiser les données avant soumission
   */
  previewData(): void {
    console.log('📋 Données du formulaire:', this.userForm.value);
    console.log('📎 Fichiers sélectionnés:', this.selectedFiles);
  }
}