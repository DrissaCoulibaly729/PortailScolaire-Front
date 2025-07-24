import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserRoles } from '../constants/roles';

export const enseignantGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ EnseignantGuard: Vérification des permissions enseignant...');

  // 🔧 CORRECTION: Attendre que l'AuthService soit initialisé
  await authService.waitForInitialization();

  // Vérifier l'authentification
  if (!authService.isAuthenticated()) {
    console.log('❌ EnseignantGuard: Non authentifié');
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  // Vérifier le rôle enseignant ou administrateur
  if (authService.hasAnyRole([UserRoles.ENSEIGNANT, UserRoles.ADMINISTRATEUR])) {
    console.log('✅ EnseignantGuard: Accès enseignant autorisé');
    return true;
  }

  // Accès refusé
  console.warn('❌ EnseignantGuard: Accès refusé - rôle enseignant ou administrateur requis');
  authService.redirectToUserDashboard();
  return false;
};
