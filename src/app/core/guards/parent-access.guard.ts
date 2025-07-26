// src/app/core/guards/parent-access.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ParentSecurityService } from '../services/parent-security.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class ParentAccessGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private parentSecurityService: ParentSecurityService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAccess(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAccess(childRoute, state);
  }

  private checkAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();

    // 1. Vérifier que l'utilisateur est authentifié
    if (!currentUser) {
      this.notificationService.warning(
        'Accès refusé', 
        'Veuillez vous connecter pour accéder à cette page'
      );
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return of(false);
    }

    // 2. Vérifier que l'utilisateur a le rôle élève (compte élève/parent)
    if (currentUser.role !== 'eleve') {
      this.notificationService.error(
        'Accès refusé',
        'Cette section est réservée aux élèves et parents'
      );
      this.router.navigate(['/auth/login']);
      return of(false);
    }

    // 3. Si la route contient un ID d'élève, vérifier l'accès spécifique
    const eleveId = route.params['eleveId'] || route.queryParams['eleveId'];
    
    if (eleveId) {
      return this.parentSecurityService.verifierAccesEleve(+eleveId).pipe(
        map(acces => {
          if (!acces.allowed) {
            this.notificationService.error(
              'Accès refusé',
              acces.reason || 'Vous ne pouvez accéder qu\'aux données de vos enfants'
            );
            
            // Rediriger vers le dashboard parent
            this.router.navigate(['/eleve/dashboard']);
            return false;
          }
          return true;
        }),
        catchError(error => {
          console.error('Erreur lors de la vérification d\'accès:', error);
          this.notificationService.error(
            'Erreur',
            'Impossible de vérifier vos permissions d\'accès'
          );
          this.router.navigate(['/eleve/dashboard']);
          return of(false);
        })
      );
    }

    // 4. Pour les routes générales (sans ID spécifique), autoriser l'accès
    return of(true);
  }
}