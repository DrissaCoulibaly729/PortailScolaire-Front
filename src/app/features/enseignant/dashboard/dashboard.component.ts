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
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <p class="text-gray-600 mt-2" *ngIf="currentUser">
              Bienvenue, {{ currentUser.prenom }} {{ currentUser.nom }}
            </p>
          </div>
          <div class="flex space-x-3">
            <button (click)="refreshData()" 
                    [disabled]="isLoading"
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
              <svg class="w-4 h-4 mr-2" [class.animate-spin]="isLoading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Actualiser
            </button>
            <button (click)="router.navigate(['/enseignant/notes/new'])" 
                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Nouvelle note
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && !dashboardData" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="dashboardData && !isLoading">
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <!-- Mes Classes -->
          <div class="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-blue-100">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Mes classes</p>
                <p class="text-2xl font-bold text-gray-900">{{ dashboardData.stats.totalClasses }}</p>
              </div>
            </div>
          </div>

          <!-- Mes Matières -->
          <div class="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-purple-100">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Mes matières</p>
                <p class="text-2xl font-bold text-gray-900">{{ dashboardData.stats.totalMatieres }}</p>
              </div>
            </div>
          </div>

          <!-- Total Élèves -->
          <div class="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-green-100">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total élèves</p>
                <p class="text-2xl font-bold text-gray-900">{{ dashboardData.stats.totalEleves }}</p>
              </div>
            </div>
          </div>

          <!-- Notes Saisies -->
          <div class="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-orange-100">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Notes saisies</p>
                <p class="text-2xl font-bold text-gray-900">{{ dashboardData.stats.notesSaisies }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Rapides -->
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button (click)="router.navigate(['/enseignant/notes/new'])" 
                    class="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <svg class="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <div class="text-left">
                <p class="font-medium text-gray-900">Saisir des notes</p>
                <p class="text-sm text-gray-600">Ajouter de nouvelles notes</p>
              </div>
            </button>

            <button (click)="router.navigate(['/enseignant/notes'])" 
                    class="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <svg class="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <div class="text-left">
                <p class="font-medium text-gray-900">Voir mes notes</p>
                <p class="text-sm text-gray-600">Consulter toutes les notes</p>
              </div>
            </button>

            <button (click)="router.navigate(['/enseignant/classes'])" 
                    class="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <svg class="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
              </svg>
              <div class="text-left">
                <p class="font-medium text-gray-900">Gérer mes classes</p>
                <p class="text-sm text-gray-600">Voir les détails des classes</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Activité Récente -->
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8" *ngIf="dashboardData.recentActivity?.length > 0">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Activité récente</h3>
          <div class="space-y-4">
            <div *ngFor="let activity of dashboardData.recentActivity" 
                 class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-600" [ngSwitch]="activity.type">
                    <!-- Note ajoutée -->
                    <path *ngSwitchCase="'note_added'" fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"></path>
                    <!-- Note modifiée -->
                    <path *ngSwitchCase="'note_updated'" fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h2a1 1 0 100-2H4V4h12v3a1 1 0 102 0V4a2 2 0 00-2-2H4zm4.707 7.707L11 12l2.293-2.293a1 1 0 011.414 1.414L12.414 13.5l2.293 2.293a1 1 0 01-1.414 1.414L11 15l-2.293 2.207a1 1 0 01-1.414-1.414L9.586 13.5 7.293 11.207a1 1 0 111.414-1.414z" clip-rule="evenodd"></path>
                    <!-- Note supprimée -->
                    <path *ngSwitchCase="'note_deleted'" fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 012 0v4a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v4a1 1 0 11-2 0V9z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">{{ activity.message }}</p>
                <p class="text-xs text-gray-500">{{ activity.timestamp | date:'short' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Grille Classes et Matières -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Mes Classes -->
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Mes classes</h3>
                <button (click)="router.navigate(['/enseignant/classes'])" 
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Voir tout
                </button>
              </div>
            </div>
            <div class="p-6">
              <div class="space-y-3" *ngIf="dashboardData.classes?.length > 0; else noClasses">
                <div *ngFor="let classe of dashboardData.classes" 
                     class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                     (click)="router.navigate(['/enseignant/classes', classe.id])">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-600">{{ classe.nom.charAt(0) }}</span>
                    </div>
                    <div class="ml-3">
                      <p class="font-medium text-gray-900">{{ classe.nom }}</p>
                      <p class="text-sm text-gray-600">{{ classe.effectif_actuel || 0 }} élèves</p>
                    </div>
                  </div>
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
              <ng-template #noClasses>
                <div class="text-center py-8">
                  <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
                  </svg>
                  <p class="text-gray-500">Aucune classe assignée</p>
                </div>
              </ng-template>
            </div>
          </div>

          <!-- Mes Matières -->
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Mes matières</h3>
                <button (click)="router.navigate(['/enseignant/matieres'])" 
                        class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  Voir tout
                </button>
              </div>
            </div>
            <div class="p-6">
              <div class="space-y-3" *ngIf="dashboardData.matieres?.length > 0; else noMatieres">
                <div *ngFor="let matiere of dashboardData.matieres" 
                     class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                     (click)="router.navigate(['/enseignant/matieres', matiere.id])">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span class="text-sm font-medium text-purple-600">{{ matiere.code || matiere.nom.charAt(0) }}</span>
                    </div>
                    <div class="ml-3">
                      <p class="font-medium text-gray-900">{{ matiere.nom }}</p>
                      <p class="text-sm text-gray-600">Coeff. {{ matiere.coefficient }}</p>
                    </div>
                  </div>
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
              <ng-template #noMatieres>
                <div class="text-center py-8">
                  <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  <p class="text-gray-500">Aucune matière assignée</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class="text-sm font-medium text-red-800">Erreur de chargement</h3>
            <p class="text-sm text-red-700 mt-1">{{ errorMessage }}</p>
            <button (click)="loadDashboardData()" 
                    class="mt-2 text-sm text-red-800 underline hover:text-red-900">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  `
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

  private loadDashboardData(): void {
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
}