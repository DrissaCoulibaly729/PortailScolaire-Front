// src/app/features/enseignant/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { EnseignantService, EnseignantDashboardData } from '../../../core/services/enseignant.service';
import { User, Enseignant } from '../../../shared/models/user.model';
import { Classe } from '../../../shared/models/classe.model';
import { Matiere } from '../../../shared/models/matiere.model';

@Component({
  selector: 'app-enseignant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class EnseignantDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  dashboardData: EnseignantDashboardData | null = null;
  isLoading = false;
  errorMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private enseignantService: EnseignantService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
       this.currentUser = user as User;
        if (user && user.id) {
          this.loadDashboardData();
        }
      });
  }

  // 🔧 CORRECTION 4 : Changement de private à public pour résoudre l'erreur d'accessibilité
  public loadDashboardData(): void {
    if (!this.currentUser?.id) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.enseignantService.loadDashboardData(this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des données:', error);
          this.errorMessage = 'Impossible de charger les données du tableau de bord.';
          this.isLoading = false;
        }
      });
  }

  refreshData(): void {
    if (this.currentUser?.id) {
      this.enseignantService.refreshData(this.currentUser.id);
      this.loadDashboardData();
    }
  }

  // 🔧 CORRECTIONS 1-3 : Méthodes helper sécurisées pour éviter les erreurs "undefined"
  
  /**
   * Vérifier si l'activité récente existe et n'est pas vide
   */
  hasRecentActivity(): boolean {
    return this.dashboardData?.recentActivity !== undefined && 
           this.dashboardData?.recentActivity !== null && 
           this.dashboardData.recentActivity.length > 0;
  }

  /**
   * Obtenir l'activité récente de manière sécurisée
   */
  getRecentActivity() {
    return this.dashboardData?.recentActivity || [];
  }

  /**
   * Vérifier si les classes existent et ne sont pas vides
   */
  hasClasses(): boolean {
    return this.dashboardData?.classes !== undefined && 
           this.dashboardData?.classes !== null && 
           this.dashboardData.classes.length > 0;
  }

  /**
   * Obtenir les classes de manière sécurisée
   */
  getClasses() {
    return this.dashboardData?.classes || [];
  }

  /**
   * Vérifier si les matières existent et ne sont pas vides
   */
  hasMatieres(): boolean {
    return this.dashboardData?.matieres !== undefined && 
           this.dashboardData?.matieres !== null && 
           this.dashboardData.matieres.length > 0;
  }

  /**
   * Obtenir les matières de manière sécurisée
   */
  getMatieres() {
    return this.dashboardData?.matieres || [];
  }
}