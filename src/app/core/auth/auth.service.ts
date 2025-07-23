
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { ApiService } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { APP_CONSTANTS } from '../constants/app-constants';
import { UserRoles } from '../constants/roles';
import { 
  User, 
  LoginRequest, 
  LoginResponse,
  LoginApiResponse, 
  ChangePasswordRequest 
} from '../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    this.checkAuthenticationStatus();
  }

  /**
   * Connexion de l'utilisateur avec gestion du format API spécifique
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginApiResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials, { skipApiResponseWrapper: true })
      .pipe(
        map(apiResponse => this.transformLoginResponse(apiResponse)),
        tap(response => {
          this.handleLoginSuccess(response);
        }),
        catchError(error => {
          console.error('Erreur lors de la connexion:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Transformer la réponse de l'API au format attendu
   */
  private transformLoginResponse(apiResponse: LoginApiResponse): LoginResponse {
    return {
      token: apiResponse.token,
      user: apiResponse.utilisateur,
      message: apiResponse.message
    };
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): Observable<any> {
    return this.apiService.post(API_ENDPOINTS.AUTH.LOGOUT, {})
      .pipe(
        tap(() => {
          this.handleLogout();
        }),
        catchError(error => {
          // Même en cas d'erreur, on déconnecte localement
          this.handleLogout();
          return of(null);
        })
      );
  }

  /**
   * Récupérer le profil utilisateur
   */
  getProfile(): Observable<User> {
    return this.apiService.get<User>(API_ENDPOINTS.AUTH.PROFILE)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
        })
      );
  }

  /**
   * Changer le mot de passe
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<any> {
    return this.apiService.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
  }

  /**
   * Vérifier la validité du token via l'API
   */
  verifyToken(): Observable<any> {
    return this.apiService.get(API_ENDPOINTS.AUTH.VERIFY_TOKEN)
      .pipe(
        catchError(error => {
          this.handleLogout();
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   * Pour Laravel Sanctum, on vérifie simplement la présence du token
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    // Pour Sanctum, on considère l'utilisateur authentifié s'il a un token et un utilisateur en mémoire
    return !!(token && user);
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: UserRoles): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Vérifier si l'utilisateur a l'un des rôles spécifiés
   */
  hasAnyRole(roles: UserRoles[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role as UserRoles) : false;
  }

  /**
   * Obtenir le token Laravel Sanctum
   */
  getToken(): string | null {
    return localStorage.getItem(APP_CONSTANTS.JWT.TOKEN_KEY);
  }

  /**
   * Obtenir le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(APP_CONSTANTS.JWT.REFRESH_TOKEN_KEY);
  }

  /**
   * Vérifier si le token est expiré
   * Pour Laravel Sanctum, on fait un appel API pour vérifier
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return true;
    
    // Pour Laravel Sanctum, on ne peut pas décoder le token localement
    // La vérification se fait via l'API
    return false; // On assume que le token est valide, la vérification se fait via checkAuthenticationStatus
  }

  /**
   * Valider le token Sanctum
   * Les tokens Sanctum n'ont pas de format JWT standard
   */
  private isValidSanctumToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Format typique de Laravel Sanctum: nombre|chaîne_aléatoire
    const sanctumPattern = /^\d+\|[a-zA-Z0-9]+$/;
    return sanctumPattern.test(token);
  }

  /**
   * Obtenir la date d'expiration du token
   * Non applicable pour Laravel Sanctum - retourne null
   */
  getTokenExpirationDate(): Date | null {
    // Les tokens Sanctum n'ont pas d'expiration côté client
    // L'expiration est gérée côté serveur
    return null;
  }

  /**
   * Décoder le token
   * Non applicable pour Laravel Sanctum - retourne les infos utilisateur
   */
  decodeToken(): any {
    // Pour Sanctum, on retourne les informations utilisateur stockées
    return this.getCurrentUser();
  }

  /**
   * Rediriger vers la page appropriée selon le rôle
   */
  redirectToUserDashboard(): void {
    const user = this.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    switch (user.role) {
      case UserRoles.ADMINISTRATEUR:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRoles.ENSEIGNANT:
        this.router.navigate(['/enseignant/dashboard']);
        break;
      case UserRoles.ELEVE:
        this.router.navigate(['/eleve/dashboard']);
        break;
      default:
        this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Gérer le succès de la connexion
   */
  private handleLoginSuccess(response: LoginResponse): void {
    // Vérifier que le token est valide
    if (!this.isValidSanctumToken(response.token)) {
      console.error('Token Sanctum invalide:', response.token);
      throw new Error('Token d\'authentification invalide');
    }

    // Stocker le token
    localStorage.setItem(APP_CONSTANTS.JWT.TOKEN_KEY, response.token);
    
    // Stocker les informations utilisateur
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
    
    console.log('Connexion réussie, token Sanctum stocké:', response.token);
    console.log('Utilisateur connecté:', response.user);
  }

  /**
   * Gérer la déconnexion
   */
  private handleLogout(): void {
    // Supprimer les données locales
    localStorage.removeItem(APP_CONSTANTS.JWT.TOKEN_KEY);
    localStorage.removeItem(APP_CONSTANTS.JWT.REFRESH_TOKEN_KEY);
    localStorage.removeItem('token_expires_at');
    
    // Réinitialiser les sujets
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    console.log('Déconnexion effectuée');
    
    // Rediriger vers la page de connexion
    this.router.navigate(['/auth/login']);
  }

  /**
   * Vérifier le statut d'authentification au démarrage
   */
  private checkAuthenticationStatus(): void {
    const token = this.getToken();
    
    if (token && this.isValidSanctumToken(token)) {
      // Token présent et valide, récupérer le profil utilisateur
      this.getProfile().subscribe({
        next: (user) => {
          this.isAuthenticatedSubject.next(true);
          console.log('Utilisateur reconnecté automatiquement:', user);
        },
        error: (error) => {
          console.error('Erreur lors de la récupération du profil:', error);
          this.handleLogout();
        }
      });
    } else {
      // Token invalide ou absent
      if (token) {
        console.log('Token invalide détecté, déconnexion...');
        this.handleLogout();
      }
    }
  }

  /**
   * Forcer la déconnexion (utilisé par l'intercepteur en cas d'erreur 401)
   */
  forceLogout(): void {
    console.log('Déconnexion forcée (token expiré ou invalide)');
    this.handleLogout();
  }

  /**
   * Vérifier si l'utilisateur peut accéder à une ressource
   */
  canAccess(requiredRoles: UserRoles[]): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }
    
    const user = this.getCurrentUser();
    return user ? requiredRoles.includes(user.role as UserRoles) : false;
  }

  /**
   * Obtenir les initiales de l'utilisateur pour l'avatar
   */
  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return '??';
    
    const firstNameInitial = user.prenom?.charAt(0).toUpperCase() || '';
    const lastNameInitial = user.nom?.charAt(0).toUpperCase() || '';
    
    return `${firstNameInitial}${lastNameInitial}`;
  }

  /**
   * Obtenir le nom complet de l'utilisateur
   */
  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return 'Utilisateur';
    
    return `${user.prenom} ${user.nom}`;
  }
}