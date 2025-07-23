import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { APP_CONSTANTS } from '../constants/app-constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Routes qui ne nécessitent pas d'authentification
  const publicRoutes = [
    '/auth/connexion',
    '/health',
    '/auth/reset-password'
  ];

  // Vérifier si la requête est vers une route publique
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
  
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

  // Ajouter des headers par défaut
  authReq = authReq.clone({
    headers: authReq.headers
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
  });

  // Exécuter la requête et gérer les erreurs
  return next(authReq).pipe(
    catchError(error => {
      // Gestion des erreurs d'authentification
      if (error.status === 401) {
        console.warn('Token expiré ou invalide, déconnexion forcée');
        authService.forceLogout();
      }
      
      // Gestion des erreurs d'autorisation
      if (error.status === 403) {
        console.warn('Accès refusé - permissions insuffisantes');
      }

      // Gestion des erreurs de validation (422)
      if (error.status === 422) {
        console.warn('Erreur de validation:', error.error);
      }

      // Gestion des erreurs serveur (500)
      if (error.status === 500) {
        console.error('Erreur serveur interne:', error);
      }

      return throwError(() => error);
    })
  );
};