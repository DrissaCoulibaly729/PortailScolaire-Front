import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { APP_CONSTANTS } from '../../../core/constants/app-constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      login: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Récupérer l'URL de retour si elle existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Si l'utilisateur est déjà connecté, rediriger
    if (this.authService.isAuthenticated()) {
      this.authService.redirectToUserDashboard();
    }
  }

  /**
   * Soumission du formulaire de connexion
   */
  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials = this.loginForm.value;
      console.log('Tentative de connexion avec:', credentials);

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Connexion réussie:', response);
          this.isLoading = false;
          
          // Rediriger vers le dashboard approprié selon le rôle
          this.authService.redirectToUserDashboard();
        },
        error: (error) => {
          console.error('Erreur de connexion:', error);
          this.handleLoginError(error);
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Gestion des erreurs de connexion
   */
  private handleLoginError(error: any): void {
    if (error.status === 401) {
      this.errorMessage = 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
    } else if (error.status === 422) {
      this.errorMessage = 'Données de connexion invalides.';
    } else if (error.status === 403) {
      this.errorMessage = 'Votre compte est désactivé. Contactez l\'administrateur.';
    } else if (error.status === 0) {
      this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
    } else {
      this.errorMessage = error.message || 'Une erreur est survenue lors de la connexion.';
    }
  }

  /**
   * Marquer tous les champs du formulaire comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Vérifier si un champ a une erreur et a été touché
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Obtenir le message d'erreur pour un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return fieldName === 'login' ? 'L\'email est obligatoire' : 'Le mot de passe est obligatoire';
    }
    if (field.errors['email']) {
      return 'Format d\'email invalide';
    }
    if (field.errors['minlength']) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return '';
  }

  /**
   * Démonstration - remplir avec des données de test
   * ⚠️ Utilisez les vraies données de votre API
   */
  fillTestData(): void {
    this.loginForm.patchValue({
      login: 'admin@ecole.com',
      mot_de_passe: 'password123' // ⚠️ Remplacez par le vrai mot de passe de votre API
    });
  }
}
