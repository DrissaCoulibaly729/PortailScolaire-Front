import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of, BehaviorSubject } from 'rxjs';

import { UserService } from '../../../../core/services/user.service';
import { 
  User, 
  UserFilters, 
  PaginatedResponse, 
  USER_ROLES, 
  USER_STATUS,
  UserRole 
} from '../../../../shared/models/user.model';

interface UserAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: (user: User) => void;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
            <p class="text-gray-600 mt-2">Gérer les comptes administrateurs, enseignants et élèves</p>
          </div>
          <div class="flex space-x-3">
            <button (click)="exportUsers()" 
                    class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Exporter
            </button>
            <button routerLink="/admin/users/create" 
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div class="relative">
              <input type="text" 
                     formControlName="recherche"
                     placeholder="Nom, prénom, email..."
                     class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          <!-- Role Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
            <select formControlName="role" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Tous les rôles</option>
              <option *ngFor="let role of userRoles" [value]="role.value">{{ role.label }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select formControlName="actif" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Tous les statuts</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>

          <!-- Items per page -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Par page</label>
            <select formControlName="per_page" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </form>

        <!-- Reset Filters -->
        <div class="mt-4 flex justify-end">
          <button (click)="resetFilters()" 
                  class="text-sm text-gray-600 hover:text-gray-900">
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="bg-white rounded-lg shadow-sm p-8">
        <div class="flex justify-center items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600">Chargement des utilisateurs...</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <p class="text-red-800">{{ error }}</p>
        </div>
      </div>

      <!-- Users Table -->
      <div *ngIf="!isLoading && !error" class="bg-white rounded-lg shadow-sm border overflow-hidden">
        <!-- Table Header with Bulk Actions -->
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <input type="checkbox" 
                     [checked]="isAllSelected()"
                     [indeterminate]="isSomeSelected()"
                     (change)="toggleAllSelection()"
                     class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
              <span class="ml-3 text-sm text-gray-700">
                {{ selectedUsers.size > 0 ? selectedUsers.size + ' sélectionné(s)' : 'Sélectionner tout' }}
              </span>
            </div>
            
            <!-- Bulk Actions -->
            <div *ngIf="selectedUsers.size > 0" class="flex space-x-2">
              <button (click)="bulkActivate()" 
                      class="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Activer
              </button>
              <button (click)="bulkDeactivate()" 
                      class="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Désactiver
              </button>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded opacity-0">
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of users" 
                  class="hover:bg-gray-50 transition-colors"
                  [class.bg-blue-50]="selectedUsers.has(user.id)">
                <!-- Checkbox -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <input type="checkbox" 
                         [checked]="selectedUsers.has(user.id)"
                         (change)="toggleUserSelection(user.id)"
                         class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                </td>

                <!-- User Info -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700">
                          {{ user.nom.charAt(0) }}{{ user.prenom.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ user.nom }} {{ user.prenom }}
                      </div>
                      <div class="text-sm text-gray-500" *ngIf="user.identifiant_genere">
                        ID: {{ user.identifiant_genere }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Role -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-red-100 text-red-800': user.role === 'administrateur',
                          'bg-blue-100 text-blue-800': user.role === 'enseignant',
                          'bg-green-100 text-green-800': user.role === 'eleve'
                        }">
                    {{ getRoleLabel(user.role) }}
                  </span>
                </td>

                <!-- Contact -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ user.email }}</div>
                  <div class="text-sm text-gray-500" *ngIf="user.telephone">{{ user.telephone }}</div>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-green-100 text-green-800': user.actif,
                          'bg-red-100 text-red-800': !user.actif
                        }">
                    <span class="w-1.5 h-1.5 mr-1.5 rounded-full"
                          [ngClass]="{
                            'bg-green-400': user.actif,
                            'bg-red-400': !user.actif
                          }"></span>
                    {{ user.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>

                <!-- Created Date -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.created_at | date:'short' }}
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <!-- View -->
                    <button (click)="viewUser(user)" 
                            class="text-blue-600 hover:text-blue-900" 
                            title="Voir les détails">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>

                    <!-- Edit -->
                    <button (click)="editUser(user)" 
                            class="text-indigo-600 hover:text-indigo-900" 
                            title="Modifier">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>

                    <!-- Toggle Status -->
                    <button (click)="toggleUserStatus(user)" 
                            [class]="user.actif ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
                            [title]="user.actif ? 'Désactiver' : 'Activer'">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path *ngIf="user.actif" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        <path *ngIf="!user.actif" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </button>

                    <!-- Reset Password -->
                    <button (click)="resetPassword(user)" 
                            class="text-yellow-600 hover:text-yellow-900" 
                            title="Réinitialiser le mot de passe">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                      </svg>
                    </button>

                    <!-- Delete -->
                    <button (click)="deleteUser(user)" 
                            class="text-red-600 hover:text-red-900" 
                            title="Supprimer">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="users.length === 0">
                <td colspan="7" class="px-6 py-12 text-center">
                  <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                  </svg>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                  <p class="text-gray-500 mb-6">Aucun utilisateur ne correspond aux critères de recherche.</p>
                  <button routerLink="/admin/users/create" 
                          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Créer le premier utilisateur
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="pagination" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 flex justify-between sm:hidden">
              <button [disabled]="!pagination.links.prev" 
                      (click)="goToPage(pagination.meta.current_page - 1)"
                      class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Précédent
              </button>
              <button [disabled]="!pagination.links.next" 
                      (click)="goToPage(pagination.meta.current_page + 1)"
                      class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Suivant
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Affichage de 
                  <span class="font-medium">{{ pagination.meta.from }}</span>
                  à 
                  <span class="font-medium">{{ pagination.meta.to }}</span>
                  sur 
                  <span class="font-medium">{{ pagination.meta.total }}</span>
                  résultats
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <!-- Previous -->
                  <button [disabled]="!pagination.links.prev" 
                          (click)="goToPage(pagination.meta.current_page - 1)"
                          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>

                  <!-- Page Numbers -->
                  <button *ngFor="let page of getPageNumbers()" 
                          (click)="goToPage(page)"
                          [class]="page === pagination.meta.current_page ? 
                            'bg-blue-50 border-blue-500 text-blue-600' : 
                            'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
                          class="relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                    {{ page }}
                  </button>

                  <!-- Next -->
                  <button [disabled]="!pagination.links.next" 
                          (click)="goToPage(pagination.meta.current_page + 1)"
                          class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  pagination: any = null;
  isLoading = false;
  error: string | null = null;

  // Form and filters
  filterForm: FormGroup;
  userRoles = USER_ROLES;
  
  // Selection
  selectedUsers = new Set<number>();
  
  // Search subject for debouncing
  private searchSubject = new BehaviorSubject<string>('');

  constructor(
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      recherche: [''],
      role: [''],
      actif: [''],
      per_page: [25]
    });
  }

  ngOnInit(): void {
    this.initializeSearch();
    this.loadUsers();
  }

  /**
   * Initialize search with debouncing
   */
  private initializeSearch(): void {
    // Listen to form changes
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadUsers();
    });
  }

  /**
   * Load users with current filters
   */
  loadUsers(page: number = 1): void {
    this.isLoading = true;
    this.error = null;

    const filters: UserFilters = {
      ...this.filterForm.value,
      page
    };

    // Clean empty filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof UserFilters] === '' || filters[key as keyof UserFilters] === null) {
        delete filters[key as keyof UserFilters];
      }
    });

    this.userService.getUsers(filters).subscribe({
      next: (response) => {
        this.users = response.data;
        this.pagination = {
          meta: response.meta,
          links: response.links
        };
        this.isLoading = false;
        // Clear selection when loading new data
        this.selectedUsers.clear();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.error = 'Impossible de charger les utilisateurs';
        this.isLoading = false;
        
        // Load mock data for demo
        this.loadMockData();
      }
    });
  }

  /**
   * Load mock data for demonstration
   */
  private loadMockData(): void {
    this.users = [
      {
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont&#64;ecole.fr',
        telephone: '0123456789',
        role: 'administrateur' as UserRole,
        actif: true,
        created_at: '2024-01-15T10:00:00Z',
        identifiant_genere: 'ADM001'
      },
      {
        id: 2,
        nom: 'Martin',
        prenom: 'Marie',
        email: 'marie.martin&#64;ecole.fr',
        telephone: '0123456790',
        role: 'enseignant' as UserRole,
        actif: true,
        created_at: '2024-01-16T11:00:00Z',
        identifiant_genere: 'ENS001'
      },
      {
        id: 3,
        nom: 'Durand',
        prenom: 'Pierre',
        email: 'pierre.durand@eleve.ecole.fr',
        role: 'eleve' as UserRole,
        actif: false,
        created_at: '2024-01-17T12:00:00Z',
        identifiant_genere: 'ELE001'
      }
    ];

    this.pagination = {
      meta: {
        current_page: 1,
        per_page: 25,
        total: 3,
        last_page: 1,
        from: 1,
        to: 3
      },
      links: {
        first: null,
        last: null,
        prev: null,
        next: null
      }
    };

    this.isLoading = false;
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.filterForm.reset({
      recherche: '',
      role: '',
      actif: '',
      per_page: 25
    });
  }

  /**
   * Get role label
   */
  getRoleLabel(role: UserRole): string {
    const roleObj = this.userRoles.find(r => r.value === role);
    return roleObj?.label || role;
  }

  /**
   * Selection methods
   */
  toggleUserSelection(userId: number): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
  }

  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedUsers.clear();
    } else {
      this.users.forEach(user => this.selectedUsers.add(user.id));
    }
  }

  isAllSelected(): boolean {
    return this.users.length > 0 && this.selectedUsers.size === this.users.length;
  }

  isSomeSelected(): boolean {
    return this.selectedUsers.size > 0 && this.selectedUsers.size < this.users.length;
  }

  /**
   * User actions
   */
  viewUser(user: User): void {
    // Navigate to user detail view
    this.router.navigate(['/admin/users', user.id]);
  }

  editUser(user: User): void {
    this.router.navigate(['/admin/users/edit', user.id]);
  }

  toggleUserStatus(user: User): void {
    const action = user.actif ? 'désactiver' : 'activer';
    
    if (confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
      this.userService.toggleUserStatus(user.id).subscribe({
        next: () => {
          user.actif = !user.actif;
          console.log(`Utilisateur ${action} avec succès`);
        },
        error: (error) => {
          console.error(`Erreur lors de la modification du statut:`, error);
          alert(`Impossible de ${action} l'utilisateur`);
        }
      });
    }
  }

  resetPassword(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.nom} ${user.prenom} ?`)) {
      this.userService.resetPassword(user.id).subscribe({
        next: (response) => {
          alert(`Nouveau mot de passe généré : ${response.nouveau_mot_de_passe}`);
        },
        error: (error) => {
          console.error('Erreur lors de la réinitialisation du mot de passe:', error);
          alert('Impossible de réinitialiser le mot de passe');
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${user.nom} ${user.prenom} ?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.selectedUsers.delete(user.id);
          console.log('Utilisateur supprimé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Impossible de supprimer l\'utilisateur');
        }
      });
    }
  }

  /**
   * Bulk actions
   */
  bulkActivate(): void {
    if (confirm(`Activer ${this.selectedUsers.size} utilisateur(s) ?`)) {
      const userIds = Array.from(this.selectedUsers);
      // Implementation for bulk activate
      console.log('Bulk activate:', userIds);
      this.selectedUsers.clear();
    }
  }

  bulkDeactivate(): void {
    if (confirm(`Désactiver ${this.selectedUsers.size} utilisateur(s) ?`)) {
      const userIds = Array.from(this.selectedUsers);
      // Implementation for bulk deactivate
      console.log('Bulk deactivate:', userIds);
      this.selectedUsers.clear();
    }
  }

  /**
   * Export users
   */
  exportUsers(): void {
    const filters = this.filterForm.value;
    this.userService.exportUsers(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors de l\'export:', error);
        alert('Impossible d\'exporter les utilisateurs');
      }
    });
  }

  /**
   * Pagination
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination?.meta.last_page || 1)) {
      this.loadUsers(page);
    }
  }

  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const current = this.pagination.meta.current_page;
    const last = this.pagination.meta.last_page;
    const pages: number[] = [];
    
    // Show up to 5 pages around current page
    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}