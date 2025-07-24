import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserRoles } from '../constants/roles';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AdminGuard: Vérification des permissions admin...');

  // 🔧 CORRECTION: Attendre que l'AuthService soit initialisé
  await authService.waitForInitialization();

  // Vérifier l'authentification
  if (!authService.isAuthenticated()) {
    console.log('❌ AdminGuard: Non authentifié');
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  // Vérifier le rôle administrateur
  if (authService.hasRole(UserRoles.ADMINISTRATEUR)) {
    console.log('✅ AdminGuard: Accès admin autorisé');
    return true;
  }

  // Accès refusé - rediriger vers le dashboard approprié
  console.warn('❌ AdminGuard: Accès refusé - rôle administrateur requis');
  authService.redirectToUserDashboard();
  return false;
};
