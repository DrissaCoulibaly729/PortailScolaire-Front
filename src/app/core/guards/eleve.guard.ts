import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserRoles } from '../constants/roles';

export const eleveGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ EleveGuard: Vérification des permissions élève...');

  // 🔧 CORRECTION: Attendre que l'AuthService soit initialisé
  await authService.waitForInitialization();

  // Vérifier l'authentification
  if (!authService.isAuthenticated()) {
    console.log('❌ EleveGuard: Non authentifié');
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  // Vérifier le rôle élève
  if (authService.hasRole(UserRoles.ELEVE)) {
    console.log('✅ EleveGuard: Accès élève autorisé');
    return true;
  }

  // Accès refusé
  console.warn('❌ EleveGuard: Accès refusé - rôle élève requis');
  authService.redirectToUserDashboard();
  return false;
};