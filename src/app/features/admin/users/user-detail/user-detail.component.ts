// src/app/features/admin/users/user-detail/user-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../shared/models/auth.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { UserRole } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center py-12">
        <app-loading-spinner></app-loading-spinner>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <h3 class="text-sm font-medium text-red-800">Erreur</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- User Details -->
      <div *ngIf="user && !loading" class="space-y-6">
        
        <!-- Header -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <button 
                  (click)="goBack()"
                  class="mr-4 p-2 text-gray-400 hover:text-gray-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <div>
                  <h1 class="text-2xl font-bold text-gray-900">
                    {{ getUserFullName() }}
                  </h1>
                  <p class="text-sm text-gray-500 mt-1">
                    Détails de l'utilisateur · {{ getRoleLabel(user.role) }}
                  </p>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex space-x-3">
                <button 
                  (click)="editUser()"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Modifier
                </button>
                
                <button 
                  (click)="toggleUserStatus()"
                  [class]="getStatusButtonClass()"
                  class="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          [attr.d]="user.actif ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'">
                    </path>
                  </svg>
                  {{ user.actif ? 'Désactiver' : 'Activer' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- User Information Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Main Information -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Personal Info -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Informations personnelles</h3>
              </div>
              <div class="px-6 py-4">
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Nom complet</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ getUserFullName() }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Email</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <a [href]="'mailto:' + user.email" class="text-blue-600 hover:underline">
                        {{ user.email }}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Téléphone</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span *ngIf="user.telephone">{{ user.telephone }}</span>
                      <span *ngIf="!user.telephone" class="text-gray-400">Non renseigné</span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Date de naissance</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span *ngIf="user.date_naissance">{{ user.date_naissance | date:'dd/MM/yyyy' }}</span>
                      <span *ngIf="!user.date_naissance" class="text-gray-400">Non renseignée</span>
                    </dd>
                  </div>
                  <div class="sm:col-span-2">
                    <dt class="text-sm font-medium text-gray-500">Adresse</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span *ngIf="user.adresse">{{ user.adresse }}</span>
                      <span *ngIf="!user.adresse" class="text-gray-400">Non renseignée</span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Role-specific Information -->
            <!-- Enseignant specific info -->
            <div *ngIf="user.role === 'enseignant'" class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Informations enseignant</h3>
              </div>
              <div class="px-6 py-4">
                <dl class="grid grid-cols-1 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Matières enseignées</dt>
                    <dd class="mt-1">
                      <div *ngIf="enseignantMatieres && enseignantMatieres.length > 0" class="flex flex-wrap gap-2">
                        <span *ngFor="let matiere of enseignantMatieres" 
                              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {{ matiere.nom }}
                        </span>
                      </div>
                      <span *ngIf="!enseignantMatieres || enseignantMatieres.length === 0" 
                            class="text-sm text-gray-400">
                        Aucune matière assignée
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Classes assignées</dt>
                    <dd class="mt-1">
                      <div *ngIf="enseignantClasses && enseignantClasses.length > 0" class="flex flex-wrap gap-2">
                        <span *ngFor="let classe of enseignantClasses" 
                              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {{ classe.nom }}
                        </span>
                      </div>
                      <span *ngIf="!enseignantClasses || enseignantClasses.length === 0" 
                            class="text-sm text-gray-400">
                        Aucune classe assignée
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Élève specific info -->
            <div *ngIf="user.role === 'eleve'" class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Informations élève</h3>
              </div>
              <div class="px-6 py-4">
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Classe</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span *ngIf="eleveData?.classe" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {{ eleveData.classe.nom }}
                      </span>
                      <span *ngIf="!eleveData?.classe" class="text-gray-400">Non assigné</span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Nom du parent</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span *ngIf="eleveData?.nom_parent">{{ eleveData.prenom_parent }} {{ eleveData.nom_parent }}</span>
                      <span *ngIf="!eleveData?.nom_parent" class="text-gray-400">Non renseigné</span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Email parent</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span *ngIf="eleveData?.email_parent">
                        <a [href]="'mailto:' + eleveData.email_parent" class="text-blue-600 hover:underline">
                          {{ eleveData.email_parent }}
                        </a>
                      </span>
                      <span *ngIf="!eleveData?.email_parent" class="text-gray-400">Non renseigné</span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Téléphone parent</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span *ngIf="eleveData?.telephone_parent">{{ eleveData.telephone_parent }}</span>
                      <span *ngIf="!eleveData?.telephone_parent" class="text-gray-400">Non renseigné</span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            
            <!-- Status & Stats -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Statut & Statistiques</h3>
              </div>
              <div class="px-6 py-4 space-y-4">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Statut</dt>
                  <dd class="mt-1">
                    <span [class]="getStatusBadgeClass()" 
                          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      {{ user.actif ? 'Actif' : 'Inactif' }}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Identifiant de connexion</dt>
                  <dd class="mt-1 text-sm text-gray-900 font-mono">
                    {{ user.identifiant_genere || 'Non généré' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Membre depuis</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ user.created_at | date:'dd/MM/yyyy' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Dernière modification</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ user.updated_at | date:'dd/MM/yyyy à HH:mm' }}
                  </dd>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Actions rapides</h3>
              </div>
              <div class="px-6 py-4 space-y-3">
                <button 
                  (click)="resetPassword()"
                  class="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                  Réinitialiser le mot de passe
                </button>
                
                <button 
                  (click)="sendWelcomeEmail()"
                  class="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Envoyer email de bienvenue
                </button>
                
                <button 
                  (click)="generateReport()"
                  class="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Générer un rapport
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './user-detail.component.css'
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = false;
  error: string | null = null;
  
  // Additional data for role-specific information
  enseignantMatieres: any[] = [];
  enseignantClasses: any[] = [];
  eleveData: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  /**
   * Load user details
   */
  private loadUser(): void {
    const userId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (!userId) {
      this.error = 'ID utilisateur invalide';
      return;
    }

    this.loading = true;
    this.error = null;

    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loadRoleSpecificData();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Impossible de charger les détails de l\'utilisateur';
        this.loading = false;
        console.error('Error loading user:', error);
      }
    });
  }

  /**
   * Load role-specific data
   */
  private loadRoleSpecificData(): void {
    if (!this.user) return;

    if (this.user.role === 'enseignant') {
      // Load teacher-specific data (subjects and classes)
      // TODO: Implement service calls for teacher data
      this.loadEnseignantData();
    } else if (this.user.role === 'eleve') {
      // Load student-specific data
      this.loadEleveData();
    }
  }

  /**
   * Load teacher-specific data
   */
  private loadEnseignantData(): void {
    // TODO: Implement actual service calls
    // For now, using mock data
    this.enseignantMatieres = [
      { id: 1, nom: 'Mathématiques', code: 'MATH' },
      { id: 2, nom: 'Physique', code: 'PHY' }
    ];
    
    this.enseignantClasses = [
      { id: 1, nom: '6ème A' },
      { id: 2, nom: '5ème B' }
    ];
  }

  /**
   * Load student-specific data
   */
  private loadEleveData(): void {
    // TODO: Implement actual service calls
    // For now, using mock data if user has additional properties
    if ('classe_id' in this.user!) {
      this.eleveData = this.user as any;
    }
  }

  /**
   * Get user full name
   */
  getUserFullName(): string {
    if (!this.user) return '';
    return `${this.user.prenom} ${this.user.nom}`;
  }

  /**
   * Get role label
   */
  getRoleLabel(role: UserRole): string {
    const roles = {
      'administrateur': 'Administrateur',
      'enseignant': 'Enseignant',
      'eleve': 'Élève'
    };
    return roles[role] || role;
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(): string {
    return this.user?.actif 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  /**
   * Get status button class
   */
  getStatusButtonClass(): string {
    return this.user?.actif
      ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
      : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100';
  }

  /**
   * Navigation methods
   */
  goBack(): void {
    this.router.navigate(['/admin/utilisateurs']);
  }

  editUser(): void {
    if (this.user) {
      this.router.navigate(['/admin/utilisateurs', this.user.id, 'edit']);
    }
  }

  /**
   * User actions
   */
  toggleUserStatus(): void {
    if (!this.user) return;

    this.userService.toggleUserStatus(this.user.id).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        // TODO: Show success message
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        // TODO: Show error message
      }
    });
  }

  resetPassword(): void {
    if (!this.user) return;

    this.userService.resetPassword(this.user.id).subscribe({
      next: (result) => {
        // TODO: Show password reset success with new password
        alert(`Nouveau mot de passe: ${result.nouveau_mot_de_passe}`);
      },
      error: (error) => {
        console.error('Error resetting password:', error);
        // TODO: Show error message
      }
    });
  }

  sendWelcomeEmail(): void {
    // TODO: Implement welcome email functionality
    alert('Fonctionnalité d\'envoi d\'email en cours de développement');
  }

  generateReport(): void {
    // TODO: Implement report generation
    alert('Fonctionnalité de génération de rapport en cours de développement');
  }
}