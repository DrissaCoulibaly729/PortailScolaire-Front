import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserRoles } from '../constants/roles';

export const eleveGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier l'authentification
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  // Vérifier le rôle élève
  if (authService.hasRole(UserRoles.ELEVE)) {
    return true;
  }

  // Accès refusé
  console.warn('Accès refusé: rôle élève requis');
  authService.redirectToUserDashboard();
  return false;
};