// src/app/features/eleve-parent/profile/eleve-detail/eleve-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EleveParentService } from '../../../../core/services/eleve-parent.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { Eleve } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-eleve-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './eleve-detail.component.html',
  styleUrls: ['./eleve-detail.component.css']
})
export class EleveDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // État du composant
  eleve: Eleve | null = null;
  isLoading = true;
  error = '';

  constructor(
    private eleveParentService: EleveParentService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEleveDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les détails de l'élève
   */
  private loadEleveDetails(): void {
    this.isLoading = true;
    this.error = '';

    this.eleveParentService.getEleveDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.allowed && response.data) {
            this.eleve = response.data;
          } else {
            this.error = response.reason || 'Impossible de charger vos informations';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des détails:', error);
          this.error = 'Erreur lors du chargement de vos informations';
          this.isLoading = false;
        }
      });
  }

  /**
   * ✅ CORRIGÉ: Navigation sécurisée vers les notes
   */
  naviguerVersNotes(): void {
    this.router.navigate(['/eleve/notes'])
      .then(success => {
        if (!success) {
          console.error('Erreur de navigation vers les notes');
          this.notificationService.error('Erreur', 'Impossible d\'accéder aux notes');
        }
      })
      .catch(error => {
        console.error('Erreur de navigation:', error);
        this.notificationService.error('Erreur', 'Erreur de navigation');
      });
  }

  /**
   * ✅ CORRIGÉ: Navigation sécurisée vers les bulletins
   */
  naviguerVersBulletins(): void {
    this.router.navigate(['/eleve/bulletins'])
      .then(success => {
        if (!success) {
          console.error('Erreur de navigation vers les bulletins');
          this.notificationService.error('Erreur', 'Impossible d\'accéder aux bulletins');
        }
      })
      .catch(error => {
        console.error('Erreur de navigation:', error);
        this.notificationService.error('Erreur', 'Erreur de navigation');
      });
  }

  /**
   * ✅ CORRIGÉ: Navigation sécurisée vers le planning
   */
  naviguerVersPlanning(): void {
    this.router.navigate(['/eleve/planning'])
      .then(success => {
        if (!success) {
          console.error('Erreur de navigation vers le planning');
          this.notificationService.warning('Information', 'Le planning n\'est pas encore disponible');
        }
      })
      .catch(error => {
        console.error('Erreur de navigation:', error);
        this.notificationService.error('Erreur', 'Erreur de navigation');
      });
  }

  /**
   * ✅ CORRIGÉ: Navigation sécurisée vers l'édition
   */
  naviguerVersEdition(): void {
    this.router.navigate(['/eleve/profile/edit'])
      .then(success => {
        if (!success) {
          console.error('Erreur de navigation vers l\'édition du profil');
          this.notificationService.error('Erreur', 'Impossible d\'accéder à la modification');
        }
      })
      .catch(error => {
        console.error('Erreur de navigation:', error);
        this.notificationService.error('Erreur', 'Erreur de navigation');
      });
  }

  /**
   * Actualiser les données
   */
  refresh(): void {
    this.loadEleveDetails();
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  /**
   * Vérifier si les informations de contact parent sont disponibles
   */
  hasParentContact(): boolean {
    return !!(this.eleve?.nom_parent && this.eleve?.prenom_parent);
  }

  /**
   * Vérifier si les informations de contact complets sont disponibles
   */
  hasCompleteContact(): boolean {
    return !!(this.eleve?.email_parent || this.eleve?.telephone_parent);
  }

  /**
   * Obtenir le nom complet du parent
   */
  getParentFullName(): string {
    if (!this.eleve) return '';
    return `${this.eleve.prenom_parent || ''} ${this.eleve.nom_parent || ''}`.trim();
  }

  /**
   * Obtenir le nom complet de l'élève
   */
  getEleveFullName(): string {
    if (!this.eleve) return '';
    return `${this.eleve.prenom} ${this.eleve.nom}`;
  }

  /**
   * Calculer l'âge de l'élève
   */
  getAge(): number | null {
    if (!this.eleve?.date_naissance) return null;
    
    const birthDate = new Date(this.eleve.date_naissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Formater la moyenne
   */
  formatMoyenne(moyenne: number | undefined): string {
    return moyenne ? moyenne.toFixed(2) + '/20' : 'Non calculée';
  }

  /**
   * Obtenir la couleur de la moyenne
   */
  getMoyenneColor(moyenne: number | undefined): string {
    if (!moyenne) return 'text-gray-600';
    
    if (moyenne >= 15) return 'text-green-600';
    if (moyenne >= 12) return 'text-blue-600';
    if (moyenne >= 10) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Vérifier si l'utilisateur peut modifier ses informations
   */
  canEditProfile(): boolean {
    // L'élève peut toujours modifier certaines informations
    return true;
  }
}