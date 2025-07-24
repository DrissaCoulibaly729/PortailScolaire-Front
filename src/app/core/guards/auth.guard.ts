import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AuthGuard: Vérification de l\'authentification...');

  // 🔧 CORRECTION: Attendre que l'AuthService soit initialisé
  await authService.waitForInitialization();

  if (authService.isAuthenticated()) {
    console.log('✅ AuthGuard: Utilisateur authentifié');
    return true;
  }

  console.log('❌ AuthGuard: Utilisateur non authentifié, redirection vers login');
  
  // Rediriger vers la page de connexion avec l'URL de retour
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};
