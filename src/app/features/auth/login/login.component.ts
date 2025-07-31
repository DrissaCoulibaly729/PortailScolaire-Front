import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { LoginRequest } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  showPassword = false;
  returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      login: ['', [Validators.required]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Check if user is already authenticated
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.redirectAfterLogin();
      }
    });

    // Auto-fill with admin credentials for demo
    this.fillDemoCredentials('admin');
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const loginRequest: LoginRequest = {
      login: this.loginForm.value.login,
      mot_de_passe: this.loginForm.value.mot_de_passe
    };

    this.authService.login(loginRequest)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Connexion réussie:', response);
          
          // Handle remember me
          if (this.loginForm.value.rememberMe) {
            // Store remember me preference
            localStorage.setItem('rememberMe', 'true');
          }

          this.redirectAfterLogin();
        },
        error: (error) => {
          console.error('Erreur de connexion:', error);
          this.handleLoginError(error);
        }
      });
  }

  /**
   * Handle login errors
   */
  private handleLoginError(error: any): void {
    if (error.status === 401) {
      this.error = 'Identifiants incorrects. Veuillez vérifier votre email/identifiant et votre mot de passe.';
    } else if (error.status === 403) {
      this.error = 'Votre compte a été désactivé. Contactez l\'administrateur.';
    } else if (error.status === 422) {
      this.error = 'Données de connexion invalides. Veuillez corriger les erreurs.';
    } else if (error.status === 0) {
      this.error = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    } else {
      this.error = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
    }
  }

  /**
   * Redirect user after successful login based on their role
   */
  private redirectAfterLogin(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Redirect based on user role or return URL
        if (this.returnUrl !== '/') {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          switch (user.role) {
            case 'administrateur':
              this.router.navigate(['/admin/dashboard']);
              break;
            case 'enseignant':
              this.router.navigate(['/enseignant/dashboard']);
              break;
            case 'eleve':
              this.router.navigate(['/eleve/dashboard']);
              break;
            default:
              this.router.navigate(['/admin/dashboard']);
              break;
          }
        }
      }
    });
  }

  /**
   * Fill form with demo credentials
   */
  fillDemoCredentials(role: 'admin' | 'enseignant' | 'eleve'): void {
    const credentials = {
      admin: {
        login: 'admin@ecole.com',
        mot_de_passe: 'motdepasse123'
      },
      enseignant: {
        login: 'enseignant&#64;ecole.fr',
        mot_de_passe: 'ens123'
      },
      eleve: {
        login: 'eleve&#64;ecole.fr',
        mot_de_passe: 'eleve123'
      }
    };

    this.loginForm.patchValue(credentials[role]);
    this.error = null;
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'login' ? 'L\'email ou identifiant' : 'Le mot de passe'} est requis`;
      }
      if (field.errors['minlength']) {
        return 'Le mot de passe doit contenir au moins 6 caractères';
      }
      if (field.errors['email']) {
        return 'Format d\'email invalide';
      }
    }
    return '';
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error = null;
  }
}