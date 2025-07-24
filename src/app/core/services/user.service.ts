// ===== src/app/core/services/user.service.ts (TYPES CORRIGÉS) =====
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  PaginatedResponse,
  LaravelApiResponse
} from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) {}

  /**
   * Récupérer la liste des utilisateurs avec filtres et pagination
   * FORMAT DE VOTRE API: { message, statut, utilisateurs: { data: [...], pagination... } }
   */
  getUsers(filters?: UserFilters): Observable<PaginatedResponse<User>> {
    const params = this.buildFilterParams(filters);
    return this.apiService.get<LaravelApiResponse<User>>(API_ENDPOINTS.ADMIN.USERS, { params }).pipe(
      map((response: LaravelApiResponse<User>) => {
        console.log('🔍 Réponse API brute:', response);
        
        // Votre API retourne: { message, statut, utilisateurs: { data: [...], current_page, ... } }
        if (response && response.utilisateurs) {
          const result: PaginatedResponse<User> = {
            data: response.utilisateurs.data || [],
            meta: {
              current_page: response.utilisateurs.current_page,
              per_page: response.utilisateurs.per_page,
              total: response.utilisateurs.total,
              last_page: response.utilisateurs.last_page,
              from: response.utilisateurs.from,
              to: response.utilisateurs.to
            },
            links: {
              first: response.utilisateurs.first_page_url,
              last: response.utilisateurs.last_page_url,
              prev: response.utilisateurs.prev_page_url,
              next: response.utilisateurs.next_page_url
            }
          };
          
          console.log('✅ Données transformées:', result);
          return result;
        }
        
        console.warn('⚠️ Format de réponse inattendu:', response);
        return this.createEmptyPaginatedResponse();
      })
    );
  }

  /**
   * Créer une réponse paginée vide
   */
  private createEmptyPaginatedResponse(): PaginatedResponse<User> {
    return {
      data: [],
      meta: {
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
        from: null,
        to: null
      },
      links: {
        first: undefined,
        last: undefined,
        prev: null,
        next: null
      }
    };
  }

  /**
   * Récupérer un utilisateur par ID
   * Adapté au format de votre API (à adapter selon votre réponse exacte)
   */
  getUserById(id: number): Observable<User> {
    return this.apiService.get<any>(API_ENDPOINTS.ADMIN.USER_BY_ID(id)).pipe(
      map((response: any) => {
        // Si votre API pour un utilisateur unique retourne { message, statut, utilisateur: {...} }
        if (response && response.utilisateur) {
          return response.utilisateur as User;
        }
        // Si votre API retourne directement l'utilisateur dans data
        if (response && response.data) {
          return response.data as User;
        }
        return response as User;
      })
    );
  }

  /**
   * Créer un nouvel enseignant
   */
  createEnseignant(data: CreateEnseignantRequest): Observable<Enseignant> {
    return this.apiService.post<any>(API_ENDPOINTS.ADMIN.CREATE_ENSEIGNANT, data).pipe(
      map((response: any) => {
        // Adaptez selon le format de réponse de votre API pour la création
        if (response && response.utilisateur) {
          return response.utilisateur as Enseignant;
        }
        if (response && response.data) {
          return response.data as Enseignant;
        }
        return response as Enseignant;
      })
    );
  }

  /**
   * Créer un nouvel élève
   */
  createEleve(data: CreateEleveRequest): Observable<Eleve> {
    return this.apiService.post<any>(API_ENDPOINTS.ADMIN.CREATE_ELEVE, data).pipe(
      map((response: any) => {
        if (response && response.utilisateur) {
          return response.utilisateur as Eleve;
        }
        if (response && response.data) {
          return response.data as Eleve;
        }
        return response as Eleve;
      })
    );
  }

  /**
   * Mettre à jour un utilisateur
   */
  updateUser(id: number, data: UpdateUserRequest): Observable<User> {
    return this.apiService.put<any>(API_ENDPOINTS.ADMIN.UPDATE_USER(id), data).pipe(
      map((response: any) => {
        if (response && response.utilisateur) {
          return response.utilisateur as User;
        }
        if (response && response.data) {
          return response.data as User;
        }
        return response as User;
      })
    );
  }

  /**
   * Activer ou désactiver un utilisateur
   */
  toggleUserStatus(id: number): Observable<User> {
    return this.apiService.patch<any>(API_ENDPOINTS.ADMIN.TOGGLE_USER_STATUS(id), {}).pipe(
      map((response: any) => {
        if (response && response.utilisateur) {
          return response.utilisateur as User;
        }
        if (response && response.data) {
          return response.data as User;
        }
        return response as User;
      })
    );
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  resetPassword(id: number): Observable<{ nouveau_mot_de_passe: string }> {
    return this.apiService.patch<any>(API_ENDPOINTS.ADMIN.RESET_PASSWORD(id), {}).pipe(
      map((response: any) => {
        if (response && response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(id: number): Observable<void> {
    return this.apiService.delete<any>(API_ENDPOINTS.ADMIN.DELETE_USER(id)).pipe(
      map(() => void 0)
    );
  }

  /**
   * Upload d'un document justificatif
   */
  uploadDocument(userId: number, file: File, documentType: string): Observable<any> {
    return this.apiService.upload(
      `/admin/utilisateurs/${userId}/documents`,
      file,
      { type: documentType }
    ).pipe(
      map((response: any) => {
        if (response && response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Récupérer les statistiques des utilisateurs
   */
  getUserStats(): Observable<any> {
    return this.apiService.get<any>('/admin/utilisateurs/statistiques').pipe(
      map((response: any) => {
        if (response && response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Rechercher des utilisateurs (autocomplete)
   */
  searchUsers(query: string, role?: string): Observable<User[]> {
    const params = { q: query, ...(role && { role }) };
    return this.apiService.get<any>('/admin/utilisateurs/recherche', { params }).pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response as User[];
        if (response.data && Array.isArray(response.data)) return response.data as User[];
        if (response.utilisateurs && Array.isArray(response.utilisateurs)) return response.utilisateurs as User[];
        return [] as User[];
      })
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
    return this.apiService.upload('/admin/utilisateurs/import', file).pipe(
      map((response: any) => {
        if (response && response.data) {
          return response.data;
        }
        return response;
      })
    );
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
    if (user.role === 'administrateur') {
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