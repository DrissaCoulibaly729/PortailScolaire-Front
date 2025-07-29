// src/app/features/eleve-parent/profile/eleve-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EleveParentService } from '../../../core/services/eleve-parent.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

import { Eleve, User } from '../../../shared/models/user.model';
import { Classe } from '../../../shared/models/classe.model';

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
  currentUser: User | null = null;
  isLoading = true;
  error = '';

  // Permissions
  canModify = false;

  constructor(
    private eleveParentService: EleveParentService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
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
            this.checkPermissions();
          } else {
            this.error = response.reason || 'Accès non autorisé aux informations de l\'élève';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des détails élève:', error);
          this.error = 'Erreur lors du chargement des informations';
          this.isLoading = false;
          this.notificationService.error('Erreur', 'Impossible de charger les informations de l\'élève');
        }
      });
  }

  /**
   * Vérifier les permissions de modification
   */
  private checkPermissions(): void {
    if (!this.eleve) return;

    this.eleveParentService.canModifyData(this.eleve.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (canModify) => {
          this.canModify = canModify;
        },
        error: (error) => {
          console.error('Erreur vérification permissions:', error);
          this.canModify = false;
        }
      });
  }

  /**
   * Actualiser les données
   */
  refresh(): void {
    this.loadEleveDetails();
  }

  /**
   * Obtenir les initiales de l'utilisateur
   */
  getUserInitials(): string {
    if (!this.eleve) return '';
    const firstInitial = this.eleve.prenom?.charAt(0).toUpperCase() || '';
    const lastInitial = this.eleve.nom?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Formater la date de naissance
   */
  formatDateNaissance(): string {
    if (!this.eleve?.date_naissance) return 'Non renseignée';
    return new Date(this.eleve.date_naissance).toLocaleDateString('fr-FR');
  }

  /**
   * Calculer l'âge
   */
  calculateAge(): number | null {
    if (!this.eleve?.date_naissance) return null;
    const today = new Date();
    const birthDate = new Date(this.eleve.date_naissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Vérifier si les informations de contact parent sont disponibles
   */
  hasParentContact(): boolean {
    return !!(this.eleve?.email_parent || this.eleve?.telephone_parent);
  }

  /**
   * Obtenir le statut de l'élève
   */
  getStatutEleve(): string {
    // Logique pour déterminer le statut (actif, suspendu, etc.)
    // À adapter selon votre modèle de données
    return 'Actif';
  }

  /**
   * Obtenir la couleur du statut
   */
  getStatutColor(): string {
    const statut = this.getStatutEleve();
    switch (statut) {
      case 'Actif': return 'text-green-600 bg-green-100';
      case 'Suspendu': return 'text-red-600 bg-red-100';
      case 'En attente': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Vérifier si l'élève a une photo
   */
  hasPhoto(): boolean {
    // À implémenter selon votre système de gestion des photos
    return false;
  }

  /**
   * Obtenir l'URL de la photo
   */
  getPhotoUrl(): string {
    // À implémenter selon votre système de gestion des photos
    return '/assets/images/default-avatar.png';
  }
}