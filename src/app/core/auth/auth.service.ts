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
  private isInitialized = false;

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // 🔧 CORRECTION: Clé pour stocker l'utilisateur dans localStorage
  private readonly USER_STORAGE_KEY = 'portail_scolaire_user';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // 🔧 CORRECTION: Initialisation synchrone d'abord, puis vérification en arrière-plan
    this.initializeAuth();
  }

  /**
   * 🔧 CORRECTION MAJEURE: Initialisation avec persistance utilisateur
   */
  private initializeAuth(): void {
    console.log('🔐 Initialisation de l\'authentification...');
    
    try {
      const token = this.getToken();
      const storedUser = this.getStoredUser();
      
      if (!token || !this.isValidSanctumToken(token)) {
        console.log('❌ Aucun token valide trouvé');
        this.setNotAuthenticated();
        this.isInitialized = true;
        return;
      }

      if (storedUser) {
        // ✅ CORRECTION: Utiliser l'utilisateur stocké directement
        console.log('✅ Utilisateur trouvé dans le localStorage:', storedUser.email);
        this.setAuthenticated(storedUser);
        this.isInitialized = true;
        
        // 🔧 NOUVEAU: Vérification optionnelle en arrière-plan (sans déconnecter en cas d'erreur)
        this.verifyProfileInBackground();
      } else {
        // Seulement si pas d'utilisateur stocké, on essaie de récupérer le profil
        console.log('⚠️ Token trouvé mais pas d\'utilisateur stocké, récupération du profil...');
        this.getProfile().subscribe({
          next: (user) => {
            console.log('✅ Profil récupéré et utilisateur reconnecté:', user.email);
            this.setAuthenticated(user);
            this.storeUser(user); // ✅ CORRECTION: Stocker l'utilisateur
            this.isInitialized = true;
          },
          error: (error) => {
            console.error('❌ Erreur lors de la récupération du profil:', error);
            this.setNotAuthenticated();
            this.isInitialized = true;
          }
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.setNotAuthenticated();
      this.isInitialized = true;
    }
  }

  /**
   * 🔧 NOUVELLE MÉTHODE: Stocker l'utilisateur dans localStorage
   */
  private storeUser(user: User): void {
    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
      console.log('💾 Utilisateur stocké dans localStorage');
    } catch (error) {
      console.error('❌ Erreur lors du stockage de l\'utilisateur:', error);
    }
  }

  /**
   * 🔧 NOUVELLE MÉTHODE: Récupérer l'utilisateur du localStorage
   */
  private getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem(this.USER_STORAGE_KEY);
      if (userData) {
        const user = JSON.parse(userData) as User;
        console.log('📖 Utilisateur récupéré du localStorage:', user.email);
        return user;
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la lecture de l\'utilisateur stocké:', error);
      // Nettoyer les données corrompues
      localStorage.removeItem(this.USER_STORAGE_KEY);
      return null;
    }
  }

  /**
   * 🔧 NOUVELLE MÉTHODE: Vérification du profil en arrière-plan
   * Cette méthode ne déconnecte PAS l'utilisateur en cas d'erreur
   */
  private verifyProfileInBackground(): void {
    console.log('🔍 Vérification du profil en arrière-plan...');
    
    this.getProfile().subscribe({
      next: (user) => {
        console.log('✅ Profil vérifié et à jour:', user.email);
        // Mettre à jour les données si nécessaire
        this.currentUserSubject.next(user);
        this.storeUser(user);
      },
      error: (error) => {
        console.warn('⚠️ Erreur lors de la vérification du profil (arrière-plan):', error);
        
        // ✅ CORRECTION: Déconnecter seulement si erreur 401 (token expiré)
        if (error.status === 401) {
          console.log('🚨 Token expiré, déconnexion...');
          this.setNotAuthenticated();
          this.router.navigate(['/auth/login']);
        }
        // Pour les autres erreurs (réseau, etc.), on garde l'utilisateur connecté
      }
    });
  }

  /**
   * 🔧 NOUVELLE MÉTHODE: Attendre que l'initialisation soit terminée
   */
  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) return;
    
    return new Promise((resolve) => {
      const checkInit = () => {
        if (this.isInitialized) {
          resolve();
        } else {
          setTimeout(checkInit, 50);
        }
      };
      checkInit();
    });
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
          // Même en cas d'erreur API, on déconnecte localement
          this.handleLogout();
          return of(null);
        })
      );
  }

  /**
   * 🔧 CORRECTION: Récupérer le profil utilisateur avec gestion d'erreur
   */
  getProfile(): Observable<User> {
    return this.apiService.get<any>(API_ENDPOINTS.AUTH.PROFILE, { 
      skipErrorHandling: true 
    }).pipe(
      map((response: any) => {
        // Adaptez selon le format de votre API pour le profil
        if (response && response.utilisateur) {
          return response.utilisateur as User;
        }
        if (response && response.data) {
          return response.data as User;
        }
        return response as User;
      }),
      tap(user => {
        console.log('👤 Profil utilisateur récupéré:', user.email);
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du profil:', error);
        return throwError(() => error);
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
          if (error.status === 401) {
            this.handleLogout();
          }
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
   * 🔧 CORRECTION: Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    // Pour Sanctum, on considère l'utilisateur authentifié s'il a un token valide et un utilisateur en mémoire
    const isAuth = !!(token && this.isValidSanctumToken(token) && user);
    
    console.log('🔍 Vérification authentification:', {
      hasToken: !!token,
      tokenValid: token ? this.isValidSanctumToken(token) : false,
      hasUser: !!user,
      isAuthenticated: isAuth
    });
    
    return isAuth;
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
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return true;
    
    // Pour Laravel Sanctum, on ne peut pas décoder le token localement
    return false;
  }

  /**
   * 🔧 CORRECTION: Valider le token Sanctum
   */
  private isValidSanctumToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Format typique de Laravel Sanctum: nombre|chaîne_aléatoire
    const sanctumPattern = /^\d+\|[a-zA-Z0-9]+$/;
    const isValid = sanctumPattern.test(token);
    
    console.log('🔍 Validation token:', { 
      token: token.substring(0, 20) + '...', 
      isValid 
    });
    
    return isValid;
  }

  /**
   * Obtenir la date d'expiration du token
   */
  getTokenExpirationDate(): Date | null {
    return null;
  }

  /**
   * Décoder le token
   */
  decodeToken(): any {
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
   * 🔧 CORRECTION: Définir l'état authentifié avec stockage
   */
  private setAuthenticated(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    console.log('✅ Utilisateur authentifié:', user.email);
  }

  /**
   * 🔧 CORRECTION: Définir l'état non authentifié avec nettoyage complet
   */
  private setNotAuthenticated(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.clearTokens();
    console.log('❌ Utilisateur non authentifié');
  }

  /**
   * 🔧 CORRECTION: Nettoyer tous les tokens et données
   */
  private clearTokens(): void {
    localStorage.removeItem(APP_CONSTANTS.JWT.TOKEN_KEY);
    localStorage.removeItem(APP_CONSTANTS.JWT.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_STORAGE_KEY); // ✅ CORRECTION: Nettoyer aussi l'utilisateur
    localStorage.removeItem('token_expires_at');
    console.log('🧹 Tokens et données utilisateur nettoyés');
  }

  /**
   * 🔧 CORRECTION: Gérer le succès de la connexion avec stockage utilisateur
   */
  private handleLoginSuccess(response: LoginResponse): void {
    // Vérifier que le token est valide
    if (!this.isValidSanctumToken(response.token)) {
      console.error('Token Sanctum invalide:', response.token);
      throw new Error('Token d\'authentification invalide');
    }

    // Stocker le token
    localStorage.setItem(APP_CONSTANTS.JWT.TOKEN_KEY, response.token);
    
    // ✅ CORRECTION: Stocker l'utilisateur ET définir l'état authentifié
    this.storeUser(response.user);
    this.setAuthenticated(response.user);
    
    console.log('✅ Connexion réussie, token et utilisateur stockés');
  }

  /**
   * Gérer la déconnexion
   */
  private handleLogout(): void {
    this.setNotAuthenticated();
    console.log('🚪 Déconnexion effectuée');
    
    // Rediriger vers la page de connexion
    this.router.navigate(['/auth/login']);
  }

  /**
   * Forcer la déconnexion (utilisé par l'intercepteur en cas d'erreur 401)
   */
  forceLogout(): void {
    console.log('🚨 Déconnexion forcée (token expiré ou invalide)');
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

  /**
   * 🔧 NOUVELLE MÉTHODE: Forcer la réinitialisation (pour debug)
   */
  debugReinitialize(): void {
    console.log('🔧 Réinitialisation forcée de l\'authentification');
    this.isInitialized = false;
    this.initializeAuth();
  }

  /**
   * 🔧 NOUVELLE MÉTHODE: Vérifier l'état de stockage (pour debug)
   */
  debugStorageState(): void {
    console.log('🔍 État du stockage:', {
      token: this.getToken()?.substring(0, 20) + '...',
      storedUser: this.getStoredUser()?.email,
      currentUser: this.getCurrentUser()?.email,
      isAuthenticated: this.isAuthenticated()
    });
  }

  /**
   * 🔧 NOUVELLE MÉTHODE: Forcer la synchronisation (si désynchronisation)
   */
  forceSyncUserData(): void {
    console.log('🔄 Synchronisation forcée des données utilisateur...');
    
    this.getProfile().subscribe({
      next: (user) => {
        this.storeUser(user);
        this.setAuthenticated(user);
        console.log('✅ Données utilisateur synchronisées');
      },
      error: (error) => {
        console.error('❌ Erreur lors de la synchronisation:', error);
        if (error.status === 401) {
          this.setNotAuthenticated();
        }
      }
    });
  }
}