// ===== src/app/features/admin/dashboard/dashboard.component.ts =====

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { DashboardService } from '../../../core/services/dashboard.service';

// ✅ Interface corrigée selon votre API
export interface DashboardStats {
  message: string;
  statut: string;
  tableau_bord: {
    utilisateurs: {
      total: number;
      administrateurs: number;
      enseignants: number;
      eleves: number;
      actifs: number;
      inactifs: number;
      nouveaux_ce_mois: number;
      repartition_par_role: {
        eleve: number;
        enseignant: number;
        administrateur: number;
      };
    };
    classes: {
      total: number;
      actives: number;
      inactives: number;
      effectif_total: number;
      capacite_totale: number;
      taux_occupation: number;
      repartition_par_niveau: Array<{
        niveau: string;
        nb_classes: number;
        capacite: number;
        eleves_count: number;
      }>;
      classes_pleines: number;
    };
    matieres: {
      total: number;
      actives: number;
      inactives: number;
      avec_enseignants: number;
      sans_enseignants: number;
      coefficient_moyen: number;
      repartition_coefficients: Array<{
        coefficient: string;
        nombre: number;
      }>;
    };
    academique: {
      moyennes_par_classe: any[];
      moyenne_generale_ecole: number;
      nb_notes_total: number;
      notes_ce_mois: number;
      eleves_en_difficulte: any[];
      excellents_eleves: any[];
    };
    bulletins: {
      total_generes: number;
      disponibles: number;
      en_attente: number;
      generes_ce_mois: number;
      repartition_mentions: any[];
    };
    activite_recente: {
      derniers_utilisateurs: Array<{
        id: number;
        nom: string;
        prenom: string;
        role: string;
        created_at: string;
      }>;
      dernieres_notes: any[];
      derniers_bulletins: any[];
      connexions_recentes: Array<{
        id: number;
        nom: string;
        prenom: string;
        role: string;
        updated_at: string;
      }>;
    };
  };
}

interface StatCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  route?: string;
  details?: string;
}

interface RecentActivity {
  id: number;
  type: 'user_created' | 'user_login' | 'note_added' | 'class_updated';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  user: {
    name: string;
    role: string;
    avatar: string;
  };
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    route: string;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">🏫 Tableau de bord</h1>
        <p class="text-gray-600 mt-2">Vue d'ensemble de l'établissement scolaire</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Chargement du tableau de bord...</span>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <p class="text-red-800 font-medium">{{ error }}</p>
            <button (click)="loadDashboardData()" 
                    class="text-red-600 hover:text-red-800 text-sm underline mt-1">
              Réessayer
            </button>
          </div>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!isLoading && !error">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div *ngFor="let card of statCards" 
               class="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
               (click)="navigateToSection(card.route)">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-600">{{ card.title }}</p>
                <p class="text-3xl font-bold mt-1" [ngClass]="'text-' + card.color + '-600'">
                  {{ card.value | number }}
                </p>
                <p *ngIf="card.details" class="text-xs text-gray-500 mt-1">{{ card.details }}</p>
                
                <div *ngIf="card.trend" class="flex items-center mt-2">
                  <svg *ngIf="card.trend.isPositive" class="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <svg *ngIf="!card.trend.isPositive" class="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="text-sm" [ngClass]="card.trend.isPositive ? 'text-green-600' : 'text-red-600'">
                    {{ card.trend.value }}{{ card.trend.value > 1 ? '' : '%' }}
                  </span>
                </div>
              </div>
              <div class="p-3 rounded-full" [ngClass]="'bg-' + card.color + '-100'">
                <svg class="w-6 h-6" [ngClass]="'text-' + card.color + '-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="card.icon"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts and Activity Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Performance by Class Chart -->
          <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Répartition par niveau</h3>
            <div *ngIf="niveauxData.length > 0; else noClassData" class="space-y-4">
              <div *ngFor="let niveau of niveauxData" 
                   class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p class="font-medium text-gray-900">{{ niveau.niveau }}</p>
                  <p class="text-sm text-gray-600">{{ niveau.nb_classes }} classe(s)</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-gray-900">{{ niveau.eleves_count }}</p>
                  <p class="text-sm text-gray-500">élèves</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-600">Capacité: {{ niveau.capacite }}</p>
                  <div class="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div class="bg-blue-600 h-2 rounded-full" 
                         [style.width.%]="getOccupationRate(niveau.eleves_count, niveau.capacite)"></div>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noClassData>
              <div class="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                <div class="text-center">
                  <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  <p class="text-gray-500">Aucune donnée de classe</p>
                </div>
              </div>
            </ng-template>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">⚡ Activité récente</h3>
            <div *ngIf="recentActivities.length > 0; else noActivity" class="space-y-4">
              <div *ngFor="let activity of recentActivities" class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center"
                       [ngClass]="{
                         'bg-blue-100': activity.type === 'user_created',
                         'bg-green-100': activity.type === 'user_login',
                         'bg-yellow-100': activity.type === 'note_added',
                         'bg-purple-100': activity.type === 'class_updated'
                       }">
                    <svg class="w-4 h-4" 
                         [ngClass]="{
                           'text-blue-600': activity.type === 'user_created',
                           'text-green-600': activity.type === 'user_login',
                           'text-yellow-600': activity.type === 'note_added',
                           'text-purple-600': activity.type === 'class_updated'
                         }" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="activity.icon"></path>
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ activity.title }}</p>
                  <p class="text-sm text-gray-600">{{ activity.description }}</p>
                  <div class="flex items-center mt-1">
                    <span class="text-xs text-gray-500">{{ activity.timestamp | date:'short' }}</span>
                    <span class="mx-2 text-gray-300">•</span>
                    <span class="text-xs text-gray-500">{{ activity.user.name }}</span>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noActivity>
              <div class="text-center py-8">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-gray-500 text-sm">Aucune activité récente</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Quick Actions and Alerts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Quick Actions -->
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">🚀 Actions rapides</h3>
            <div class="grid grid-cols-2 gap-4">
              <button (click)="router.navigate(['/admin/utilisateurs/create'])" 
                      class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                </svg>
                <span class="text-sm font-medium text-gray-900">Nouvel utilisateur</span>
              </button>
              
              <button (click)="router.navigate(['/admin/classes/create'])" 
                      class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <svg class="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM9 7h6m-6 4h6m-6 4h4"></path>
                </svg>
                <span class="text-sm font-medium text-gray-900">Nouvelle classe</span>
              </button>
              
              <button (click)="router.navigate(['/admin/matieres/create'])" 
                      class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <svg class="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <span class="text-sm font-medium text-gray-900">Nouvelle matière</span>
              </button>
              
              <button (click)="generateReport()" 
                      class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <svg class="w-8 h-8 text-orange-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span class="text-sm font-medium text-gray-900">Générer rapport</span>
              </button>
            </div>
          </div>

          <!-- Alerts and Notifications -->
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">🔔 Alertes système</h3>
            <div *ngIf="systemAlerts.length > 0; else noAlerts" class="space-y-3">
              <div *ngFor="let alert of systemAlerts" 
                   class="p-3 rounded-lg border-l-4" 
                   [ngClass]="{
                     'bg-red-50 border-red-400': alert.type === 'error',
                     'bg-yellow-50 border-yellow-400': alert.type === 'warning',
                     'bg-blue-50 border-blue-400': alert.type === 'info',
                     'bg-green-50 border-green-400': alert.type === 'success'
                   }">
                <div class="flex justify-between">
                  <div class="flex">
                    <svg class="w-5 h-5 mr-2 mt-0.5" 
                         [ngClass]="{
                           'text-red-400': alert.type === 'error',
                           'text-yellow-400': alert.type === 'warning',
                           'text-blue-400': alert.type === 'info',
                           'text-green-400': alert.type === 'success'
                         }" 
                         fill="currentColor" viewBox="0 0 20 20">
                      <path *ngIf="alert.type === 'error'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                      <path *ngIf="alert.type === 'warning'" fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      <path *ngIf="alert.type === 'info'" fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                      <path *ngIf="alert.type === 'success'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                      <p class="text-sm font-medium" 
                         [ngClass]="{
                           'text-red-800': alert.type === 'error',
                           'text-yellow-800': alert.type === 'warning',
                           'text-blue-800': alert.type === 'info',
                           'text-green-800': alert.type === 'success'
                         }">
                        {{ alert.title }}
                      </p>
                      <p class="text-sm" 
                         [ngClass]="{
                           'text-red-700': alert.type === 'error',
                           'text-yellow-700': alert.type === 'warning',
                           'text-blue-700': alert.type === 'info',
                           'text-green-700': alert.type === 'success'
                         }">
                        {{ alert.message }}
                      </p>
                    </div>
                  </div>
                  <button *ngIf="alert.action" 
                          (click)="router.navigate([alert.action.route])"
                          class="text-xs px-2 py-1 rounded"
                          [ngClass]="{
                            'bg-red-100 text-red-800 hover:bg-red-200': alert.type === 'error',
                            'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': alert.type === 'warning',
                            'bg-blue-100 text-blue-800 hover:bg-blue-200': alert.type === 'info',
                            'bg-green-100 text-green-800 hover:bg-green-200': alert.type === 'success'
                          }">
                    {{ alert.action.label }}
                  </button>
                </div>
              </div>
            </div>
            <ng-template #noAlerts>
              <div class="text-center py-8">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-gray-500 text-sm">Tout va bien ! Aucune alerte.</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  error: string | null = null;
  
  statCards: StatCard[] = [];
  recentActivities: RecentActivity[] = [];
  systemAlerts: SystemAlert[] = [];
  niveauxData: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Charger toutes les données du dashboard - CORRIGÉ
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getDashboardStats().pipe(
      catchError((error: any) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.error = 'Impossible de charger les données du dashboard';
        return of(null);
      })
    ).subscribe({
      next: (data: DashboardStats | null) => {
        if (data && data.tableau_bord) {
          this.buildStatCards(data);
          this.buildRecentActivities(data);
          this.buildSystemAlerts(data);
          this.buildNiveauxData(data);
        } else {
          this.loadMockData();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.error = 'Impossible de charger les données du dashboard';
        this.isLoading = false;
        this.loadMockData();
      }
    });
  }

  /**
   * Construire les cartes de statistiques - CORRIGÉ
   */
  private buildStatCards(response: DashboardStats): void {
    const stats = response.tableau_bord;
    
    this.statCards = [
      {
        title: 'Utilisateurs totaux',
        value: stats.utilisateurs.total || 0,
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
        color: 'blue',
        trend: { 
          value: stats.utilisateurs.nouveaux_ce_mois || 0,
          isPositive: (stats.utilisateurs.nouveaux_ce_mois || 0) > 0 
        },
        route: '/admin/utilisateurs',
        details: `${stats.utilisateurs.actifs} actifs, ${stats.utilisateurs.inactifs} inactifs`
      },
      {
        title: 'Classes actives',
        value: stats.classes.total || 0,
        icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM9 7h6m-6 4h6m-6 4h4',
        color: 'green',
        trend: { 
          value: Math.round(stats.classes.taux_occupation || 0),
          isPositive: (stats.classes.taux_occupation || 0) > 50 
        },
        route: '/admin/classes',
        details: `${stats.classes.effectif_total} élèves inscrits`
      },
      {
        title: 'Matières',
        value: stats.matieres.total || 0,
        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        color: 'purple',
        route: '/admin/matieres',
        details: `Coefficient moyen: ${stats.matieres.coefficient_moyen || 0}`,
        trend: {
          value: stats.matieres.avec_enseignants || 0,
          isPositive: (stats.matieres.avec_enseignants || 0) > (stats.matieres.sans_enseignants || 0)
        }
      },
      {
        title: 'Moyenne générale',
        value: stats.academique.moyenne_generale_ecole || 0,
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        color: 'orange',
        trend: { 
          value: stats.academique.notes_ce_mois || 0,
          isPositive: (stats.academique.notes_ce_mois || 0) > 0 
        },
        details: `${stats.academique.nb_notes_total || 0} notes au total`
      }
    ];
  }

  /**
   * Construire les données par niveau
   */
  private buildNiveauxData(response: DashboardStats): void {
    this.niveauxData = response.tableau_bord.classes.repartition_par_niveau || [];
  }

  /**
   * Construire les activités récentes - CORRIGÉ
   */
  private buildRecentActivities(response: DashboardStats): void {
    const activite = response.tableau_bord.activite_recente;
    this.recentActivities = [];
    
    // Derniers utilisateurs
    if (activite.derniers_utilisateurs && activite.derniers_utilisateurs.length > 0) {
      activite.derniers_utilisateurs.slice(0, 3).forEach(user => {
        this.recentActivities.push({
          id: user.id,
          type: 'user_created',
          title: 'Nouvel utilisateur',
          description: `${user.prenom} ${user.nom} (${this.getRoleLabel(user.role)})`,
          timestamp: new Date(user.created_at),
          icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
          user: {
            name: `${user.prenom} ${user.nom}`,
            role: user.role,
            avatar: this.generateAvatar(user.prenom, user.nom)
          }
        });
      });
    }
    
    // Connexions récentes
    if (activite.connexions_recentes && activite.connexions_recentes.length > 0) {
      activite.connexions_recentes.slice(0, 2).forEach(connection => {
        this.recentActivities.push({
          id: connection.id + 1000,
          type: 'user_login',
          title: 'Connexion récente',
          description: `${connection.prenom} ${connection.nom} s'est connecté`,
          timestamp: new Date(connection.updated_at),
          icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
          user: {
            name: `${connection.prenom} ${connection.nom}`,
            role: connection.role,
            avatar: this.generateAvatar(connection.prenom, connection.nom)
          }
        });
      });
    }
    
    // Trier par timestamp
    this.recentActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    this.recentActivities = this.recentActivities.slice(0, 5);
  }

  /**
   * Construire les alertes système - CORRIGÉ
   */
  private buildSystemAlerts(response: DashboardStats): void {
    const stats = response.tableau_bord;
    this.systemAlerts = [];
    
    // Alerte si aucune note
    if (stats.academique.nb_notes_total === 0) {
      this.systemAlerts.push({
        id: 'no_grades',
        type: 'warning',
        title: 'Aucune note enregistrée',
        message: 'Le système ne contient aucune note. Encouragez les enseignants à saisir les évaluations.',
        action: {
          label: 'Gérer les notes',
          route: '/admin/notes'
        }
      });
    }
    
    // Alerte matières sans enseignants
    if (stats.matieres.sans_enseignants > stats.matieres.avec_enseignants) {
      this.systemAlerts.push({
        id: 'subjects_no_teachers',
        type: 'warning',
        title: 'Matières sans enseignants',
        message: `${stats.matieres.sans_enseignants} matières n'ont pas d'enseignant assigné.`,
        action: {
          label: 'Affecter des enseignants',
          route: '/admin/matieres'
        }
      });
    }
    
    // Alerte taux d'occupation faible
    if (stats.classes.taux_occupation < 10 && stats.classes.effectif_total > 0) {
      this.systemAlerts.push({
        id: 'low_occupation',
        type: 'info',
        title: 'Taux d\'occupation faible',
        message: `Le taux d'occupation des classes est de ${stats.classes.taux_occupation.toFixed(1)}%.`,
        action: {
          label: 'Voir les classes',
          route: '/admin/classes'
        }
      });
    }
    
    // Alerte croissance utilisateurs
    if (stats.utilisateurs.nouveaux_ce_mois >= 5) {
      this.systemAlerts.push({
        id: 'many_new_users',
        type: 'success',
        title: 'Croissance d\'utilisateurs',
        message: `${stats.utilisateurs.nouveaux_ce_mois} nouveaux utilisateurs ce mois. Excellent !`,
        action: {
          label: 'Voir les utilisateurs',
          route: '/admin/utilisateurs'
        }
      });
    }
  }

  /**
   * Charger des données de démonstration
   */
  private loadMockData(): void {
    this.statCards = [
      {
        title: 'Utilisateurs totaux',
        value: 8,
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
        color: 'blue',
        trend: { value: 8, isPositive: true },
        route: '/admin/utilisateurs',
        details: '7 actifs, 1 inactif'
      },
      {
        title: 'Classes actives',
        value: 5,
        icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM9 7h6m-6 4h6m-6 4h4',
        color: 'green',
        trend: { value: 2, isPositive: true },
        route: '/admin/classes',
        details: '3 élèves inscrits'
      },
      {
        title: 'Matières',
        value: 7,
        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        color: 'purple',
        route: '/admin/matieres',
        details: 'Coefficient moyen: 2.29'
      },
      {
        title: 'Moyenne générale',
        value: 0,
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        color: 'orange',
        details: '0 notes au total'
      }
    ];
    
    this.recentActivities = [
      {
        id: 1,
        type: 'user_created',
        title: 'Nouvel utilisateur',
        description: 'Drissa Coulibaly (Élève)',
        timestamp: new Date('2025-07-27T22:53:28.000Z'),
        icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
        user: { name: 'Drissa Coulibaly', role: 'eleve', avatar: 'DC' }
      }
    ];
    
    this.systemAlerts = [
      {
        id: 'no_grades',
        type: 'warning',
        title: 'Aucune note enregistrée',
        message: 'Le système ne contient aucune note. Encouragez les enseignants à saisir les évaluations.',
        action: { label: 'Gérer les notes', route: '/admin/notes' }
      }
    ];

    this.niveauxData = [
      { niveau: '6ème', nb_classes: 2, capacite: 70, eleves_count: 2 },
      { niveau: '5ème', nb_classes: 1, capacite: 40, eleves_count: 0 },
      { niveau: '4ème', nb_classes: 1, capacite: 40, eleves_count: 0 },
      { niveau: 'Terminal', nb_classes: 1, capacite: 40, eleves_count: 1 }
    ];
  }

  /**
   * Méthodes utilitaires
   */
  private getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      'administrateur': 'Administrateur',
      'enseignant': 'Enseignant',
      'eleve': 'Élève'
    };
    return roleLabels[role] || role;
  }

  private generateAvatar(prenom: string, nom: string): string {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  /**
   * Calculer le taux d'occupation
   */
  getOccupationRate(eleves: number, capacite: number): number {
    if (capacite === 0) return 0;
    return Math.min(100, Math.round((eleves / capacite) * 100));
  }

  /**
   * Naviguer vers une section
   */
  navigateToSection(route?: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  /**
   * Générer un rapport
   */
  generateReport(): void {
    console.log('Génération de rapport...');
    // Implémentez votre logique de génération de rapport
  }
}