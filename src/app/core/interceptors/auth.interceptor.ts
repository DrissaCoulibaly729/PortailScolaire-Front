import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Routes qui ne nécessitent pas d'authentification
  const publicRoutes = [
    '/auth/connexion',
    '/health',
    '/auth/reset-password'
  ];

  // 🔧 NOUVEAU: Routes qui ne doivent pas déclencher une déconnexion automatique
  const noAutoLogoutRoutes = [
    '/auth/profil',
    '/auth/verifier-token'
  ];

  // Vérifier si la requête est vers une route publique
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
  
  // 🔧 NOUVEAU: Vérifier si c'est une route qui ne doit pas déclencher de déconnexion
  const isNoAutoLogoutRoute = noAutoLogoutRoutes.some(route => req.url.includes(route));
  
  // Cloner la requête pour la modifier
  let authReq = req;

  // Ajouter le token si l'utilisateur est authentifié et ce n'est pas une route publique
  if (!isPublicRoute && authService.isAuthenticated()) {
    const token = authService.getToken();
    
    if (token) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }
  }

  // Ajouter des headers par défaut pour les requêtes JSON
  if (!authReq.headers.has('Content-Type') && 
      !(authReq.body instanceof FormData)) {
    authReq = authReq.clone({
      headers: authReq.headers.set('Content-Type', 'application/json')
    });
  }

  // Ajouter headers standards
  authReq = authReq.clone({
    headers: authReq.headers
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
  });

  // Exécuter la requête et gérer les erreurs
  return next(authReq).pipe(
    catchError(error => {
      // 🔧 CORRECTION: Gestion des erreurs d'authentification sans boucle infinie
      if (error.status === 401) {
        console.warn('❌ Erreur 401 détectée sur:', req.url);
        
        // Si c'est une route qui ne doit pas déclencher de déconnexion automatique
        if (isNoAutoLogoutRoute) {
          console.log('⚠️ Route protégée, pas de déconnexion automatique');
        } else {
          console.warn('🚨 Token expiré ou invalide, déconnexion forcée');
          // Utiliser setTimeout pour éviter les problèmes de cycle
          setTimeout(() => {
            authService.forceLogout();
          }, 100);
        }
      }
      
      // Gestion des erreurs d'autorisation
      if (error.status === 403) {
        console.warn('❌ Accès refusé - permissions insuffisantes');
      }

      // Gestion des erreurs de validation (422)
      if (error.status === 422) {
        console.warn('⚠️ Erreur de validation:', error.error);
      }

      // Gestion des erreurs serveur (500)
      if (error.status === 500) {
        console.error('💥 Erreur serveur interne:', error);
      }

      // Gestion des erreurs de connexion (0)
      if (error.status === 0) {
        console.error('🌐 Erreur de connexion - serveur inaccessible');
      }

      return throwError(() => error);
    })
  );
};