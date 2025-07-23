// ===== src/app/core/auth/auth.service.ts =====
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

import { ApiService } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { APP_CONSTANTS } from '../constants/app-constants';
import { UserRoles } from '../constants/roles';
import { 
  User, 
  LoginRequest, 
  LoginResponse, 
  ChangePasswordRequest 
} from '../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private jwtHelper = new JwtHelperService();

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
   * Connexion de l'utilisateur
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
      .pipe(
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
   * Vérifier la validité du token
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
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
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
   * Obtenir le token JWT
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
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return true;
    
    try {
      return this.jwtHelper.isTokenExpired(tokenToCheck);
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return true;
    }
  }

  /**
   * Obtenir la date d'expiration du token
   */
  getTokenExpirationDate(): Date | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      return this.jwtHelper.getTokenExpirationDate(token);
    } catch (error) {
      console.error('Erreur lors de la récupération de la date d\'expiration:', error);
      return null;
    }
  }

  /**
   * Décoder le token JWT
   */
  decodeToken(): any {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      return this.jwtHelper.decodeToken(token);
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
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
    // Stocker le token
    localStorage.setItem(APP_CONSTANTS.JWT.TOKEN_KEY, response.token);
    
    // Stocker les informations utilisateur
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
    
    // Optionnel: stocker la date d'expiration
    if (response.expires_at) {
      localStorage.setItem('token_expires_at', response.expires_at);
    }
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
    
    // Rediriger vers la page de connexion
    this.router.navigate(['/auth/login']);
  }

  /**
   * Vérifier le statut d'authentification au démarrage
   */
  private checkAuthenticationStatus(): void {
    const token = this.getToken();
    
    if (token && !this.isTokenExpired(token)) {
      // Token valide, récupérer le profil utilisateur
      this.getProfile().subscribe({
        next: (user) => {
          this.isAuthenticatedSubject.next(true);
        },
        error: (error) => {
          console.error('Erreur lors de la récupération du profil:', error);
          this.handleLogout();
        }
      });
    } else {
      // Token invalide ou expiré
      if (token) {
        this.handleLogout();
      }
    }
  }

  /**
   * Forcer la déconnexion (utilisé par l'intercepteur en cas d'erreur 401)
   */
  forceLogout(): void {
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