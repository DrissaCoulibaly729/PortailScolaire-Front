import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { DashboardService } from '../../../core/services/dashboard.service';
import { UserService } from '../../../core/services/user.service';
import { ClasseService } from '../../../core/services/classe.service';
import { MatiereService } from '../../../core/services/matiere.service';
import { DashboardStats, StatistiquesAvancees } from '../../../shared/models/dashboard.model';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  route?: string;
}

interface RecentActivity {
  id: string;
  type: 'user_created' | 'note_added' | 'class_updated';
  message: string;
  timestamp: Date;
  user: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p class="text-gray-600 mt-2">Vue d'ensemble de l'établissement scolaire</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <p class="text-red-800">{{ error }}</p>
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
              <div>
                <p class="text-sm font-medium text-gray-600">{{ card.title }}</p>
                <p class="text-3xl font-bold" [ngClass]="'text-' + card.color + '-600'">
                  {{ card.value | number }}
                </p>
                <div *ngIf="card.trend" class="flex items-center mt-2">
                  <svg *ngIf="card.trend.isPositive" class="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <svg *ngIf="!card.trend.isPositive" class="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="text-sm" [ngClass]="card.trend.isPositive ? 'text-green-600' : 'text-red-600'">
                    {{ card.trend.value }}%
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
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance par classe</h3>
            <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div class="text-center">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <p class="text-gray-500">Graphique de performance</p>
                <p class="text-sm text-gray-400">(À implémenter avec Chart.js)</p>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
            <div class="space-y-4">
              <div *ngFor="let activity of recentActivities" class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center"
                       [ngClass]="{
                         'bg-blue-100': activity.type === 'user_created',
                         'bg-green-100': activity.type === 'note_added',
                         'bg-yellow-100': activity.type === 'class_updated'
                       }">
                    <svg class="w-4 h-4" 
                         [ngClass]="{
                           'text-blue-600': activity.type === 'user_created',
                           'text-green-600': activity.type === 'note_added',
                           'text-yellow-600': activity.type === 'class_updated'
                         }" 
                         fill="currentColor" viewBox="0 0 20 20">
                      <path *ngIf="activity.type === 'user_created'" d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z"></path>
                      <path *ngIf="activity.type === 'note_added'" fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                      <path *ngIf="activity.type === 'class_updated'" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"></path>
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">{{ activity.message }}</p>
                  <p class="text-xs text-gray-500">{{ activity.timestamp | date:'short' }} - {{ activity.user }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions and Alerts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Quick Actions -->
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div class="grid grid-cols-2 gap-4">
              <button (click)="router.navigate(['/admin/users/create'])" 
                      class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
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
              
              <button class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <svg class="w-8 h-8 text-orange-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span class="text-sm font-medium text-gray-900">Générer rapport</span>
              </button>
            </div>
          </div>

          <!-- Alerts and Notifications -->
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Alertes système</h3>
            <div class="space-y-3">
              <div *ngFor="let alert of systemAlerts" 
                   class="p-3 rounded-lg border-l-4" 
                   [ngClass]="{
                     'bg-red-50 border-red-400': alert.type === 'error',
                     'bg-yellow-50 border-yellow-400': alert.type === 'warning',
                     'bg-blue-50 border-blue-400': alert.type === 'info'
                   }">
                <div class="flex">
                  <svg class="w-5 h-5 mr-2" 
                       [ngClass]="{
                         'text-red-400': alert.type === 'error',
                         'text-yellow-400': alert.type === 'warning',
                         'text-blue-400': alert.type === 'info'
                       }" 
                       fill="currentColor" viewBox="0 0 20 20">
                    <path *ngIf="alert.type === 'error'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    <path *ngIf="alert.type === 'warning'" fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    <path *ngIf="alert.type === 'info'" fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                  </svg>
                  <div>
                    <p class="text-sm font-medium" 
                       [ngClass]="{
                         'text-red-800': alert.type === 'error',
                         'text-yellow-800': alert.type === 'warning',
                         'text-blue-800': alert.type === 'info'
                       }">
                      {{ alert.title }}
                    </p>
                    <p class="text-sm" 
                       [ngClass]="{
                         'text-red-700': alert.type === 'error',
                         'text-yellow-700': alert.type === 'warning',
                         'text-blue-700': alert.type === 'info'
                       }">
                      {{ alert.message }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
  systemAlerts: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    private userService: UserService,
    private classeService: ClasseService,
    private matiereService: MatiereService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Charger toutes les données du dashboard
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      stats: this.dashboardService.getDashboardStats(),
      advancedStats: this.dashboardService.getAdvancedStats()
    }).subscribe({
      next: (data) => {
        this.buildStatCards(data.stats);
        this.buildRecentActivities(data.stats);
        this.buildSystemAlerts(data.stats);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.error = 'Impossible de charger les données du dashboard';
        this.isLoading = false;
        
        // Données de démonstration en cas d'erreur
        this.loadMockData();
      }
    });
  }

  /**
   * Construire les cartes de statistiques
   */
  private buildStatCards(stats: any): void {
    this.statCards = [
      {
        title: 'Utilisateurs totaux',
        value: stats.total_utilisateurs || 0,
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
        color: 'blue',
        trend: { value: 12, isPositive: true },
        route: '/admin/users'
      },
      {
        title: 'Classes actives',
        value: stats.total_classes || 0,
        icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM9 7h6m-6 4h6m-6 4h4',
        color: 'green',
        trend: { value: 3, isPositive: true },
        route: '/admin/classes'
      },
      {
        title: 'Matières',
        value: stats.total_matieres || 0,
        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        color: 'purple',
        route: '/admin/matieres'
      },
      {
        title: 'Moyenne générale',
        value: stats.moyenne_generale || 0,
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        color: 'orange',
        trend: { value: 2.1, isPositive: true }
      }
    ];
  }

  /**
   * Construire les activités récentes
   */
  private buildRecentActivities(stats: any): void {
    this.recentActivities = [
      {
        id: '1',
        type: 'user_created',
        message: 'Nouvel élève inscrit en 6ème A',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        user: 'Admin Principal'
      },
      {
        id: '2',
        type: 'note_added',
        message: 'Notes de mathématiques ajoutées',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
        user: 'M. Dupont'
      },
      {
        id: '3',
        type: 'class_updated',
        message: 'Effectif de la 5ème B modifié',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4h ago
        user: 'Admin Principal'
      }
    ];
  }

  /**
   * Construire les alertes système
   */
  private buildSystemAlerts(stats: any): void {
    this.systemAlerts = [
      {
        type: 'warning',
        title: 'Classes proches de la capacité maximale',
        message: '3 classes ont plus de 90% d\'occupation'
      },
      {
        type: 'info',
        title: 'Sauvegarde programmée',
        message: 'Prochaine sauvegarde automatique ce soir à 23h00'
      }
    ];
  }

  /**
   * Charger des données de démonstration
   */
  private loadMockData(): void {
    this.statCards = [
      {
        title: 'Utilisateurs totaux',
        value: 245,
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
        color: 'blue',
        trend: { value: 12, isPositive: true },
        route: '/admin/users'
      },
      {
        title: 'Classes actives',
        value: 12,
        icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM9 7h6m-6 4h6m-6 4h4',
        color: 'green',
        trend: { value: 3, isPositive: true },
        route: '/admin/classes'
      },
      {
        title: 'Matières',
        value: 15,
        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        color: 'purple',
        route: '/admin/matieres'
      },
      {
        title: 'Moyenne générale',
        value: 13.2,
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        color: 'orange',
        trend: { value: 2.1, isPositive: true }
      }
    ];

    this.buildRecentActivities({});
    this.buildSystemAlerts({});
  }

  /**
   * Naviguer vers une section
   */
  navigateToSection(route?: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }
}