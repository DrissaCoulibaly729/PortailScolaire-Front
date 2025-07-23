import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserRoles } from '../constants/roles';

export const enseignantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier l'authentification
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  // Vérifier le rôle enseignant ou administrateur
  if (authService.hasAnyRole([UserRoles.ENSEIGNANT, UserRoles.ADMINISTRATEUR])) {
    return true;
  }

  // Accès refusé
  console.warn('Accès refusé: rôle enseignant ou administrateur requis');
  authService.redirectToUserDashboard();
  return false;
};
