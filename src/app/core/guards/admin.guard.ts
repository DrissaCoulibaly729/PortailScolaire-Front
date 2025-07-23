import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserRoles } from '../constants/roles';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier l'authentification
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  // Vérifier le rôle administrateur
  if (authService.hasRole(UserRoles.ADMINISTRATEUR)) {
    return true;
  }

  // Accès refusé - rediriger vers le dashboard approprié
  console.warn('Accès refusé: rôle administrateur requis');
  authService.redirectToUserDashboard();
  return false;
};