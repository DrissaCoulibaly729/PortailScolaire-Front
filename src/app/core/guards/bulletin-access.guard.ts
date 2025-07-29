import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { EleveParentService } from '../services/eleve-parent.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class BulletinAccessGuard implements CanActivate {
  
  constructor(
    private eleveParentService: EleveParentService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const bulletinId = route.params['id'];
    
    if (!bulletinId) {
      this.router.navigate(['/eleve/bulletins']);
      return new Observable(observer => observer.next(false));
    }

    return this.eleveParentService.getBulletinDetail(+bulletinId).pipe(
      map(response => {
        if (response.allowed && response.data) {
          return true;
        } else {
          this.notificationService.error('Accès refusé', response.reason || 'Bulletin non accessible');
          this.router.navigate(['/eleve/bulletins']);
          return false;
        }
      }),
      catchError(() => {
        this.notificationService.error('Erreur', 'Bulletin non trouvé');
        this.router.navigate(['/eleve/bulletins']);
        return new Observable(observer => observer.next(false));
      })
    );
  }
}