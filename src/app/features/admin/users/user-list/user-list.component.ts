import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { UserService } from '../../../../core/services/user.service';
import { 
  User, 
  UserFilters, 
  PaginatedResponse, 
  UserRole, 
  USER_ROLES,
  UserAction 
} from '../../../../shared/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit, OnDestroy {
  // Données
  users: User[] = [];
  paginationData: PaginatedResponse<User>['meta'] | null = null;
  
  // États
  isLoading = true;
  error: string | null = null;
  selectedUsers: number[] = [];
  showFilters = false;
  
  // Formulaires
  searchForm: FormGroup;
  filtersForm: FormGroup;
  
  // Configuration
  availableRoles = USER_ROLES;
  pageSizeOptions = [10, 15, 25, 50];
  
  // Filtres actuels
  currentFilters: UserFilters = {
    page: 1,
    per_page: 15,
    sort_by: 'created_at',
    sort_direction: 'desc'
  };
  
  // Actions disponibles
  userActions: UserAction[] = [
    {
      id: 'edit',
      label: 'Modifier',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'blue',
      action: (user: User) => this.editUser(user)
    },
    {
      id: 'toggle-status',
      label: 'Changer statut',
      icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'orange',
      action: (user: User) => this.toggleUserStatus(user)
    },
    {
      id: 'reset-password',
      label: 'Reset mot de passe',
      icon: 'M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2h.01M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'yellow',
      action: (user: User) => this.resetPassword(user)
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      action: (user: User) => this.deleteUser(user)
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({
      recherche: ['']
    });

    this.filtersForm = this.formBuilder.group({
      role: [''],
      actif: [''],
      classe_id: [''],
      per_page: [15]
    });
  }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.setupFiltersSubscription();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configuration de la recherche en temps réel
   */
  private setupSearchSubscription(): void {
    this.searchForm.get('recherche')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.currentFilters.recherche = value || undefined;
        this.currentFilters.page = 1;
        this.loadUsers();
      });
  }

  /**
   * Configuration des filtres
   */
  private setupFiltersSubscription(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(filters => {
        this.currentFilters = {
          ...this.currentFilters,
          role: filters.role || undefined,
          actif: filters.actif !== '' ? filters.actif === 'true' : undefined,
          classe_id: filters.classe_id || undefined,
          per_page: filters.per_page,
          page: 1
        };
        this.loadUsers();
      });
  }

  /**
   * Charger la liste des utilisateurs
   */
  loadUsers(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.getUsers(this.currentFilters).subscribe({
      next: (response) => {
        this.users = response.data;
        this.paginationData = response.meta;
        this.isLoading = false;
        console.log('👥 Utilisateurs chargés:', response);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.isLoading = false;
      }
    });
  }

  /**
   * Changer de page
   */
  changePage(page: number): void {
    if (page < 1 || (this.paginationData && page > this.paginationData.last_page)) {
      return;
    }
    
    this.currentFilters.page = page;
    this.loadUsers();
  }

  /**
   * Trier les résultats
   */
  sortBy(field: string): void {
    if (this.currentFilters.sort_by === field) {
      // Inverser la direction si c'est le même champ
      this.currentFilters.sort_direction = 
        this.currentFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    } else {
      // Nouveau champ, direction par défaut
      this.currentFilters.sort_by = field as any;
      this.currentFilters.sort_direction = 'asc';
    }
    
    this.currentFilters.page = 1;
    this.loadUsers();
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.searchForm.reset();
    this.filtersForm.reset({ per_page: 15 });
    this.currentFilters = {
      page: 1,
      per_page: 15,
      sort_by: 'created_at',
      sort_direction: 'desc'
    };
    this.loadUsers();
  }

  /**
   * Basculer l'affichage des filtres
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Sélectionner/désélectionner un utilisateur
   */
  toggleUserSelection(userId: number): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  /**
   * Sélectionner tous les utilisateurs visibles
   */
  toggleAllSelection(): void {
    if (this.selectedUsers.length === this.users.length) {
      this.selectedUsers = [];
    } else {
      this.selectedUsers = this.users.map(user => user.id);
    }
  }

  /**
   * Vérifier si un utilisateur est sélectionné
   */
  isUserSelected(userId: number): boolean {
    return this.selectedUsers.includes(userId);
  }

  /**
   * Actions sur les utilisateurs
   */
  editUser(user: User): void {
    // Navigation vers le formulaire d'édition
    console.log('✏️ Éditer utilisateur:', user);
    // this.router.navigate(['/admin/users/edit', user.id]);
  }

  toggleUserStatus(user: User): void {
    if (confirm(`Voulez-vous ${user.actif ? 'désactiver' : 'activer'} ${this.userService.getFullName(user)} ?`)) {
      this.userService.toggleUserStatus(user.id).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === user.id);
          if (index > -1) {
            this.users[index] = updatedUser;
          }
          console.log('✅ Statut utilisateur mis à jour');
        },
        error: (error) => {
          console.error('❌ Erreur lors du changement de statut:', error);
        }
      });
    }
  }

  resetPassword(user: User): void {
    if (confirm(`Voulez-vous réinitialiser le mot de passe de ${this.userService.getFullName(user)} ?`)) {
      this.userService.resetPassword(user.id).subscribe({
        next: (response) => {
          alert(`Nouveau mot de passe: ${response.nouveau_mot_de_passe}`);
          console.log('🔑 Mot de passe réinitialisé');
        },
        error: (error) => {
          console.error('❌ Erreur lors de la réinitialisation:', error);
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.userService.getFullName(user)} ?\n\nCette action est irréversible.`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.selectedUsers = this.selectedUsers.filter(id => id !== user.id);
          console.log('🗑️ Utilisateur supprimé');
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression:', error);
        }
      });
    }
  }

  /**
   * Actions groupées
   */
  deleteSelected(): void {
    if (this.selectedUsers.length === 0) return;
    
    if (confirm(`Voulez-vous supprimer ${this.selectedUsers.length} utilisateur(s) sélectionné(s) ?\n\nCette action est irréversible.`)) {
      // Implémenter la suppression en lot
      console.log('🗑️ Suppression groupée:', this.selectedUsers);
    }
  }

  exportUsers(): void {
    this.userService.exportUsers(this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        console.log('📥 Export terminé');
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'export:', error);
      }
    });
  }

  /**
   * Méthodes utilitaires
   */
  getUserFullName(user: User): string {
    return this.userService.getFullName(user);
  }

  getRoleLabel(role: string): string {
    return this.userService.getRoleLabel(role);
  }

  getRoleColor(role: string): string {
    return this.userService.getRoleColor(role);
  }

  getRoleClasses(role: string): string {
    const color = this.getRoleColor(role);
    return `bg-${color}-100 text-${color}-800`;
  }

  getStatusClasses(actif: boolean): string {
    return actif 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  /**
   * Obtenir l'icône de tri
   */
  getSortIcon(field: string): string {
    if (this.currentFilters.sort_by !== field) {
      return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'; // Sort icon
    }
    
    return this.currentFilters.sort_direction === 'asc'
      ? 'M3 4l9 16 9-16H3z' // Sort up
      : 'M21 20L12 4 3 20h18z'; // Sort down
  }

  /**
   * Générer la plage de pagination
   */
  getPaginationRange(): number[] {
    if (!this.paginationData) return [];
    
    const current = this.paginationData.current_page;
    const total = this.paginationData.last_page;
    const range = [];
    
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  }
}