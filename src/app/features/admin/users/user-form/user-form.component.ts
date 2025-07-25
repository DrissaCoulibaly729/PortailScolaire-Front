// ===== src/app/features/admin/users/user-form/user-form.component.ts =====

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

import { UserService } from '../../../../core/services/user.service';
import { ClasseService } from '../../../../core/services/classe.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { 
  User, 
  CreateEnseignantRequest, 
  CreateEleveRequest, 
  UpdateUserRequest,
  UserRole,
  Enseignant,
  Eleve
} from '../../../../shared/models/user.model';
import { Classe } from '../../../../shared/models/classe.model';

interface FileUpload {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface DocumentType {
  value: string;
  label: string;
  required: boolean;
  description: string;
}

interface SelectedFileType {
  [key: string]: File | null;
}

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
  serverErrors: Record<string, string[]> = {}; // ✅ AJOUT pour getServerErrors

  // Données
  currentUser: User | null = null;
  selectedRole: UserRole = 'enseignant';
  availableClasses: Classe[] = [];
  uploadedDocuments: FileUpload[] = [];

  // ✅ AJOUT des propriétés manquantes
  availableRoles: { value: UserRole; label: string; icon: string }[] = [];
  availableMatieres: any[] = []; // Remplacez par Matiere[] si vous avez l'interface
  selectedFiles: SelectedFileType = {}; // Pour stocker les fichiers sélectionnés par type
  documentTypes: DocumentType[] = [
    {
      value: 'certificat_scolarite',
      label: 'Certificat de scolarité',
      required: true,
      description: 'Document obligatoire pour l\'inscription'
    },
    {
      value: 'carte_identite',
      label: 'Carte d\'identité',
      required: true,
      description: 'Pièce d\'identité de l\'élève'
    },
    {
      value: 'justificatif_domicile',
      label: 'Justificatif de domicile',
      required: false,
      description: 'Facture ou attestation récente'
    },
    {
      value: 'photo_identite',
      label: 'Photo d\'identité',
      required: false,
      description: 'Photo récente de l\'élève'
    }
  ];

  // Configuration
  readonly roles: { value: UserRole; label: string; icon: string }[] = [
    { value: 'administrateur', label: 'Administrateur', icon: '👨‍💼' },
    { value: 'enseignant', label: 'Enseignant', icon: '👨‍🏫' },
    { value: 'eleve', label: 'Élève', icon: '👨‍🎓' }
  ];

  readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  readonly allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private classeService: ClasseService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    // Initialiser les propriétés
    this.availableRoles = [...this.roles]; // ✅ CORRECTION

    // Vérifier si on est en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.userId = +params['id'];
        this.isEditing = true;
        this.loadUser();
      }
    });

    // Charger les données nécessaires
    this.loadClasses();
    this.loadMatieres(); // ✅ AJOUT

    // Écouter les changements de rôle
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      this.onRoleChange(role);
    });
  }

  // ✅ AJOUT des getters pour les propriétés calculées
  get showTeacherFields(): boolean {
    return this.selectedRole === 'enseignant';
  }

  get showParentFields(): boolean {
    return this.selectedRole === 'eleve';
  }

  /**
   * ✅ AJOUT - Obtenir les erreurs serveur pour un champ
   */
  getServerErrors(fieldName: string): string[] {
    return this.serverErrors[fieldName] || [];
  }

  /**
   * Créer le formulaire avec validation
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      // Champs communs
      role: ['enseignant', Validators.required],
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern(/^[0-9+\-\s()]{8,20}$/)]],
      date_naissance: [''],
      adresse: [''],

      // Champs spécifiques aux élèves
      classe_id: [''],
      nom_parent: [''],
      prenom_parent: [''],
      telephone_parent: [''],
      email_parent: ['', [Validators.email]],

      // Champs administrateur
      niveau_acces: ['standard']
    });
  }

  /**
   * ✅ CORRECTION - Charger un utilisateur existant
   */
  private loadUser(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.userService.getUserById(this.userId).pipe(
      catchError((error: any) => {
        this.error = 'Erreur lors du chargement de l\'utilisateur';
        console.error('Erreur:', error);
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((user: User | null) => {
      if (user) {
        this.currentUser = user;
        this.selectedRole = user.role;
        this.populateForm(user);
      }
    });
  }

  /**
   * Charger la liste des classes
   */
  private loadClasses(): void {
    this.classeService.getClasses().pipe(
      catchError((error: any) => {
        console.error('Erreur lors du chargement des classes:', error);
        return of({ data: [] });
      })
    ).subscribe(response => {
      this.availableClasses = response.data || [];
    });
  }

  /**
   * ✅ AJOUT - Charger les matières disponibles
   */
  private loadMatieres(): void {
    // Implémentez selon votre service MatiereService
    // this.matiereService.getMatieres().subscribe(response => {
    //   this.availableMatieres = response.data || [];
    // });
    
    // Pour l'instant, données de test
    this.availableMatieres = [
      { id: 1, nom: 'Mathématiques', code: 'MATH' },
      { id: 2, nom: 'Français', code: 'FR' },
      { id: 3, nom: 'Histoire-Géographie', code: 'HG' },
      { id: 4, nom: 'Sciences', code: 'SCI' }
    ];
  }

  /**
   * Peupler le formulaire avec les données existantes
   */
  private populateForm(user: User): void {
    this.userForm.patchValue({
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      date_naissance: user.date_naissance,
      adresse: user.adresse
    });

    // Données spécifiques aux élèves
    if (user.role === 'eleve' && 'classe_id' in user) {
      const eleve = user as any;
      this.userForm.patchValue({
        classe_id: eleve.classe_id,
        nom_parent: eleve.nom_parent,
        prenom_parent: eleve.prenom_parent,
        telephone_parent: eleve.telephone_parent,
        email_parent: eleve.email_parent
      });
    }
  }

  /**
   * Gérer le changement de rôle
   */
  onRoleChange(role: UserRole): void {
    this.selectedRole = role;
    this.updateValidators();
  }

  /**
   * Mettre à jour les validateurs selon le rôle
   */
  private updateValidators(): void {
    // Réinitialiser tous les validateurs
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.clearValidators();
    });

    // Validateurs de base
    this.userForm.get('nom')?.setValidators([Validators.required, Validators.minLength(2)]);
    this.userForm.get('prenom')?.setValidators([Validators.required, Validators.minLength(2)]);
    this.userForm.get('email')?.setValidators([Validators.required, Validators.email]);
    this.userForm.get('role')?.setValidators(Validators.required);

    // Validateurs spécifiques aux élèves
    if (this.selectedRole === 'eleve') {
      this.userForm.get('classe_id')?.setValidators(Validators.required);
      this.userForm.get('nom_parent')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.userForm.get('prenom_parent')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.userForm.get('telephone_parent')?.setValidators([
        Validators.required, 
        Validators.pattern(/^[0-9+\-\s()]{8,20}$/)
      ]);
      this.userForm.get('email_parent')?.setValidators([Validators.required, Validators.email]);
    }

    // Mettre à jour les validateurs
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.updateValueAndValidity();
    });
  }

  /**
   * Soumettre le formulaire
   */
  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      this.error = 'Veuillez corriger les erreurs dans le formulaire';
      return;
    }

    if (this.isEditing) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  /**
   * ✅ CORRECTION - Créer un nouvel utilisateur
   */
  private createUser(): void {
    this.isLoading = true;
    this.error = null;
    this.serverErrors = {}; // ✅ Réinitialiser les erreurs serveur

    const formData = this.userForm.value;

    let createRequest: Observable<any>;
    switch (this.selectedRole) {
      case 'administrateur':
        // Si vous avez une méthode createAdmin
        // createRequest = this.userService.createAdmin(formData);
        // Sinon, utilisez createEnseignant pour l'instant
        createRequest = this.userService.createEnseignant(formData as CreateEnseignantRequest);
        break;
      case 'enseignant':
        createRequest = this.userService.createEnseignant(formData as CreateEnseignantRequest);
        break;
      case 'eleve':
        createRequest = this.userService.createEleve(formData as CreateEleveRequest);
        break;
      default:
        this.error = 'Type d\'utilisateur non valide';
        this.isLoading = false;
        return;
    }

    createRequest.pipe(
      catchError((error: any) => {
        this.handleError(error);
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((result: User | null) => {
      if (result) {
        this.success = `${this.getRoleLabel(this.selectedRole)} créé(e) avec succès`;
        this.notificationService.showSuccess(this.success);
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/admin/utilisateurs']);
        }, 2000);
      }
    });
  }

  /**
   * ✅ CORRECTION - Mettre à jour un utilisateur existant
   */
  private updateUser(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.error = null;
    this.serverErrors = {}; // ✅ Réinitialiser les erreurs serveur

    const updateData: UpdateUserRequest = this.userForm.value;

    this.userService.updateUser(this.userId, updateData).pipe(
      catchError((error: any) => {
        this.handleError(error);
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((result: User | null) => {
      if (result) {
        this.success = 'Utilisateur mis à jour avec succès';
        this.notificationService.showSuccess(this.success);
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/admin/utilisateurs']);
        }, 2000);
      }
    });
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: any): void {
    console.error('Erreur:', error);
    
    if (error.status === 422 && error.error?.erreurs) {
      // Erreurs de validation serveur
      this.serverErrors = error.error.erreurs;
      const messages = Object.values(this.serverErrors).flat();
      this.error = messages.join(', ');
    } else if (error.error?.message) {
      this.error = error.error.message;
    } else {
      this.error = `Erreur lors de ${this.isEditing ? 'la modification' : 'la création'} de l'utilisateur`;
    }
  }

  /**
   * ✅ CORRECTION - Gestion des fichiers avec 2 paramètres
   */
  onFileSelected(event: any, documentType?: string): void {
    const files = event.target.files;
    
    if (!files || files.length === 0) return;

    const file = files[0]; // Prendre seulement le premier fichier

    if (this.validateFile(file)) {
      if (documentType) {
        // Stocker le fichier pour ce type de document
        this.selectedFiles[documentType] = file;
      } else {
        // Ajouter à la liste générale des documents
        const fileUpload: FileUpload = {
          file: file,
          name: file.name,
          size: file.size,
          type: file.type
        };
        this.uploadedDocuments.push(fileUpload);
      }
    }
  }

  /**
   * ✅ AJOUT - Supprimer un fichier sélectionné par type
   */
  removeSelectedFile(documentType: string): void {
    if (this.selectedFiles[documentType]) {
      this.selectedFiles[documentType] = null;
    }
  }

  /**
   * Valider un fichier
   */
  private validateFile(file: File): boolean {
    if (!this.allowedFileTypes.includes(file.type)) {
      this.error = `Type de fichier non autorisé: ${file.type}`;
      return false;
    }

    if (file.size > this.maxFileSize) {
      this.error = `Fichier trop volumineux: ${this.formatFileSize(file.size)}`;
      return false;
    }

    return true;
  }

  /**
   * Supprimer un document de la liste générale
   */
  removeDocument(index: number): void {
    this.uploadedDocuments.splice(index, 1);
  }

  /**
   * ✅ AJOUT - Prévisualiser les données avant soumission
   */
  previewData(): void {
    const formData = this.userForm.value;
    console.log('Aperçu des données:', formData);
    console.log('Fichiers sélectionnés:', this.selectedFiles);
    
    // Afficher dans un modal ou une section
    alert(`Aperçu des données:\n${JSON.stringify(formData, null, 2)}`);
  }

  /**
   * ✅ CORRECTION - Générer un identifiant automatique
   */
  generateIdentifier(): void {
    const nom = this.userForm.get('nom')?.value || '';
    const prenom = this.userForm.get('prenom')?.value || '';
    
    if (nom && prenom) {
      let identifiant = '';
      
      switch (this.selectedRole) {
        case 'enseignant':
          identifiant = `ENS${nom.substring(0, 3).toUpperCase()}${prenom.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-3)}`;
          break;
        case 'eleve':
          identifiant = `ELE${nom.substring(0, 3).toUpperCase()}${prenom.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-3)}`;
          break;
        case 'administrateur':
          identifiant = `ADM${nom.substring(0, 3).toUpperCase()}${prenom.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-3)}`;
          break;
      }
      
      console.log('Identifiant généré:', identifiant);
      
      // ✅ CORRECTION - Utiliser seulement les méthodes qui existent
      if (this.notificationService.showSuccess) {
        this.notificationService.showSuccess(`Identifiant généré: ${identifiant}`);
      } else {
        // Fallback si showSuccess n'existe pas
        alert(`Identifiant généré: ${identifiant}`);
      }
    } else {
      // ✅ CORRECTION - Utiliser seulement les méthodes qui existent  
      if (this.notificationService.showError) {
        this.notificationService.showError('Veuillez remplir le nom et prénom avant de générer un identifiant');
      } else {
        // Fallback
        alert('Veuillez remplir le nom et prénom avant de générer un identifiant');
      }
    }
  }

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.userForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && field.touched;
    }
    return field.invalid && field.touched;
  }

  /**
   * Obtenir le message d'erreur pour un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} est requis`;
    if (errors['email']) return 'Format d\'email invalide';
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} trop court`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} trop long`;
    if (errors['pattern']) return `Format de ${this.getFieldLabel(fieldName)} invalide`;

    return 'Champ invalide';
  }

  /**
   * Obtenir le label d'un champ
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      nom: 'Nom',
      prenom: 'Prénom',
      email: 'Email',
      telephone: 'Téléphone',
      date_naissance: 'Date de naissance',
      adresse: 'Adresse',
      classe_id: 'Classe',
      nom_parent: 'Nom du parent',
      prenom_parent: 'Prénom du parent',
      telephone_parent: 'Téléphone du parent',
      email_parent: 'Email du parent'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Obtenir le label d'un rôle
   */
  getRoleLabel(role: UserRole): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj?.label || role;
  }

  /**
   * Obtenir l'icône d'un rôle
   */
  getRoleIcon(role: UserRole): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj?.icon || '👤';
  }

  /**
   * Méthode pour résoudre l'erreur TypeScript mentionnée
   */
  addTeacher(): void {
    // Cette méthode était manquante et causait l'erreur TS
    // Implémentation selon le contexte de votre application
    console.log('Fonctionnalité d\'ajout d\'enseignant');
    // Vous pouvez ici implémenter la logique d'ajout d'enseignant
    // Par exemple, ouvrir un modal ou naviguer vers un autre formulaire
  }

  /**
   * Annuler et retourner à la liste
   */
  cancel(): void {
    this.router.navigate(['/admin/utilisateurs']);
  }

  /**
   * Naviguer vers la liste des utilisateurs
   */
  goBack(): void {
    this.router.navigate(['/admin/utilisateurs']);
  }
}