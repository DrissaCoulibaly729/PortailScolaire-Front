// ===== src/app/core/services/user.service.ts =====
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { 
  User, 
  Enseignant, 
  Eleve, 
  CreateEnseignantRequest,
  CreateEleveRequest,
  UpdateUserRequest,
  UserFilters,
  PaginatedResponse
} from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) {}

  /**
   * Récupérer la liste des utilisateurs avec filtres et pagination
   */
  getUsers(filters?: UserFilters): Observable<PaginatedResponse<User>> {
    const params = this.buildFilterParams(filters);
    return this.apiService.get<PaginatedResponse<User>>(
      API_ENDPOINTS.ADMIN.USERS,
      { params }
    );
  }

  /**
   * Récupérer un utilisateur par ID
   */
  getUserById(id: number): Observable<User> {
    return this.apiService.get<User>(API_ENDPOINTS.ADMIN.USER_BY_ID(id));
  }

  /**
   * Créer un nouvel enseignant
   */
  createEnseignant(data: CreateEnseignantRequest): Observable<Enseignant> {
    return this.apiService.post<Enseignant>(
      API_ENDPOINTS.ADMIN.CREATE_ENSEIGNANT,
      data
    );
  }

  /**
   * Créer un nouvel élève
   */
  createEleve(data: CreateEleveRequest): Observable<Eleve> {
    return this.apiService.post<Eleve>(
      API_ENDPOINTS.ADMIN.CREATE_ELEVE,
      data
    );
  }

  /**
   * Mettre à jour un utilisateur
   */
  updateUser(id: number, data: UpdateUserRequest): Observable<User> {
    return this.apiService.put<User>(
      API_ENDPOINTS.ADMIN.UPDATE_USER(id),
      data
    );
  }

  /**
   * Activer ou désactiver un utilisateur
   */
  toggleUserStatus(id: number): Observable<User> {
    return this.apiService.patch<User>(
      API_ENDPOINTS.ADMIN.TOGGLE_USER_STATUS(id),
      {}
    );
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  resetPassword(id: number): Observable<{ nouveau_mot_de_passe: string }> {
    return this.apiService.patch<{ nouveau_mot_de_passe: string }>(
      API_ENDPOINTS.ADMIN.RESET_PASSWORD(id),
      {}
    );
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(id: number): Observable<void> {
    return this.apiService.delete<void>(API_ENDPOINTS.ADMIN.DELETE_USER(id));
  }

  /**
   * Upload d'un document justificatif
   */
  uploadDocument(userId: number, file: File, documentType: string): Observable<any> {
    return this.apiService.upload(
      `/admin/utilisateurs/${userId}/documents`,
      file,
      { type: documentType }
    );
  }

  /**
   * Récupérer les statistiques des utilisateurs
   */
  getUserStats(): Observable<any> {
    return this.apiService.get<any>('/admin/utilisateurs/statistiques');
  }

  /**
   * Rechercher des utilisateurs (autocomplete)
   */
  searchUsers(query: string, role?: string): Observable<User[]> {
    const params = { q: query, ...(role && { role }) };
    return this.apiService.get<User[]>(
      '/admin/utilisateurs/recherche',
      { params }
    );
  }

  /**
   * Exporter la liste des utilisateurs
   */
  exportUsers(filters?: UserFilters, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const params = { 
      ...this.buildFilterParams(filters),
      format 
    };
    return this.apiService.download(`/admin/utilisateurs/export?${new URLSearchParams(params).toString()}`);
  }

  /**
   * Importer des utilisateurs depuis un fichier
   */
  importUsers(file: File): Observable<any> {
    return this.apiService.upload('/admin/utilisateurs/import', file);
  }

  /**
   * Construire les paramètres de filtrage
   */
  private buildFilterParams(filters?: UserFilters): any {
    if (!filters) return {};

    const params: any = {};

    if (filters.role) params.role = filters.role;
    if (filters.actif !== undefined) params.actif = filters.actif.toString();
    if (filters.recherche) params.recherche = filters.recherche;
    if (filters.classe_id) params.classe_id = filters.classe_id.toString();
    if (filters.page) params.page = filters.page.toString();
    if (filters.per_page) params.per_page = filters.per_page.toString();
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_direction) params.sort_direction = filters.sort_direction;

    return params;
  }

  /**
   * Valider un email (côté client)
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Générer un identifiant de connexion
   */
  generateLoginIdentifier(nom: string, prenom: string): string {
    const cleanNom = nom.toLowerCase().replace(/[^a-z]/g, '');
    const cleanPrenom = prenom.toLowerCase().replace(/[^a-z]/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${cleanPrenom.substring(0, 3)}${cleanNom.substring(0, 3)}${random}`;
  }

  /**
   * Formater le nom complet d'un utilisateur
   */
  getFullName(user: User): string {
    return `${user.prenom} ${user.nom}`;
  }

  /**
   * Obtenir le label du rôle en français
   */
  getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
      'administrateur': 'Administrateur',
      'enseignant': 'Enseignant',
      'eleve': 'Élève'
    };
    return roleLabels[role] || role;
  }

  /**
   * Obtenir la couleur associée au rôle
   */
  getRoleColor(role: string): string {
    const roleColors: Record<string, string> = {
      'administrateur': 'red',
      'enseignant': 'blue',
      'eleve': 'green'
    };
    return roleColors[role] || 'gray';
  }

  /**
   * Vérifier si un utilisateur peut être supprimé
   */
  canDeleteUser(user: User): boolean {
    // Ne pas supprimer le dernier administrateur
    if (user.role === 'administrateur') {
      // Cette vérification devrait idéalement être faite côté serveur
      return true; // L'API se chargera de la validation
    }
    return true;
  }

  /**
   * Calculer l'âge d'un utilisateur
   */
  calculateAge(dateNaissance: string): number {
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}