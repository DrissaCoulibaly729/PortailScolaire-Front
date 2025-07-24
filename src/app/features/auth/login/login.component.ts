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
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Portail Administratif Scolaire
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Connectez-vous à votre compte
          </p>
        </div>

        <!-- Login Form -->
        <div class="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Login Field -->
            <div>
              <label for="login" class="block text-sm font-medium text-gray-700 mb-1">
                Email ou identifiant
              </label>
              <div class="relative">
                <input
                  id="login"
                  name="login"
                  type="text"
                  formControlName="login"
                  autocomplete="username"
                  required
                  [class.border-red-300]="loginForm.get('login')?.invalid && loginForm.get('login')?.touched"
                  [class.focus:ring-red-500]="loginForm.get('login')?.invalid && loginForm.get('login')?.touched"
                  [class.focus:border-red-500]="loginForm.get('login')?.invalid && loginForm.get('login')?.touched"
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Votre email ou identifiant">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>
              <div *ngIf="loginForm.get('login')?.invalid && loginForm.get('login')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <span *ngIf="loginForm.get('login')?.errors?.['required']">
                  L'email ou identifiant est requis
                </span>
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div class="relative">
                <input
                  id="password"
                  name="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="mot_de_passe"
                  autocomplete="current-password"
                  required
                  [class.border-red-300]="loginForm.get('mot_de_passe')?.invalid && loginForm.get('mot_de_passe')?.touched"
                  [class.focus:ring-red-500]="loginForm.get('mot_de_passe')?.invalid && loginForm.get('mot_de_passe')?.touched"
                  [class.focus:border-red-500]="loginForm.get('mot_de_passe')?.invalid && loginForm.get('mot_de_passe')?.touched"
                  class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Votre mot de passe">
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg *ngIf="!showPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <svg *ngIf="showPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.758 7.758M12 12l2.122 2.122m-2.122-2.122L7.758 7.758m6.364 6.364L12 12m2.122 2.122l2.122 2.122"></path>
                  </svg>
                </button>
              </div>
              <div *ngIf="loginForm.get('mot_de_passe')?.invalid && loginForm.get('mot_de_passe')?.touched" 
                   class="mt-1 text-sm text-red-600">
                <span *ngIf="loginForm.get('mot_de_passe')?.errors?.['required']">
                  Le mot de passe est requis
                </span>
                <span *ngIf="loginForm.get('mot_de_passe')?.errors?.['minlength']">
                  Le mot de passe doit contenir au moins 6 caractères
                </span>
              </div>
            </div>

            <!-- Remember Me -->
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  formControlName="rememberMe"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="remember-me" class="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <div class="text-sm">
                <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="error" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    Erreur de connexion
                  </h3>
                  <div class="mt-2 text-sm text-red-700">
                    {{ error }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div>
              <button
                type="submit"
                [disabled]="loginForm.invalid || isLoading"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <div *ngIf="isLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <svg *ngIf="!isLoading" class="h-5 w-5 text-blue-500 group-hover:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                  </svg>
                </span>
                {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Demo Accounts -->
        <div class="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Comptes de démonstration</h3>
          <div class="space-y-3">
            <!-- Admin Account -->
            <div class="bg-white rounded-md p-4 border-l-4 border-red-500">
              <div class="flex justify-between items-center">
                <div>
                  <h4 class="text-sm font-medium text-gray-900">Administrateur</h4>
                  <p class="text-sm text-gray-600">admin&#64;ecole.fr / admin123</p>
                </div>
                <button (click)="fillDemoCredentials('admin')" 
                        class="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full hover:bg-red-200 transition-colors">
                  Utiliser
                </button>
              </div>
            </div>

            <!-- Teacher Account -->
            <div class="bg-white rounded-md p-4 border-l-4 border-blue-500">
              <div class="flex justify-between items-center">
                <div>
                  <h4 class="text-sm font-medium text-gray-900">Enseignant</h4>
                  <p class="text-sm text-gray-600">enseignant&#64;ecole.fr / ens123</p>
                </div>
                <button (click)="fillDemoCredentials('enseignant')" 
                        class="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors">
                  Utiliser
                </button>
              </div>
            </div>

            <!-- Student Account -->
            <div class="bg-white rounded-md p-4 border-l-4 border-green-500">
              <div class="flex justify-between items-center">
                <div>
                  <h4 class="text-sm font-medium text-gray-900">Élève/Parent</h4>
                  <p class="text-sm text-gray-600">eleve&#64;ecole.fr / eleve123</p>
                </div>
                <button (click)="fillDemoCredentials('eleve')" 
                        class="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 transition-colors">
                  Utiliser
                </button>
              </div>
            </div>
          </div>
          
          <div class="mt-4 text-xs text-gray-500">
            <p>💡 <strong>Astuce :</strong> Cliquez sur "Utiliser" pour remplir automatiquement les champs de connexion avec les identifiants de démonstration.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center">
          <p class="text-xs text-gray-500">
            © 2024 Portail Administratif Scolaire. 
            <br>
            Version 1.0 - Projet étudiant
          </p>
        </div>
      </div>
    </div>
  `
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
        login: 'admin&#64;ecole.fr',
        mot_de_passe: 'admin123'
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