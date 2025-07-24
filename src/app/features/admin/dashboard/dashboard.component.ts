import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardStats, StatistiquesAvancees } from '../../../shared/models/dashboard.model';
import { BaseChartComponent } from '../../../shared/components/charts/base-chart.component';

interface QuickStatCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  route?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  dashboardStats: DashboardStats | null = null;
  advancedStats: StatistiquesAvancees | null = null;
  error: string | null = null;

  // Graphiques - PROPRIÉTÉS AJOUTÉES
  activityChartData: any = null;
  distributionChartData: any = null;
  isChartsLoading = true;

  // Statistiques rapides
  quickStats: QuickStatCard[] = [
    {
      title: 'Total Élèves',
      value: 0,
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      color: 'blue',
      route: '/admin/users?role=eleve'
    },
    {
      title: 'Enseignants',
      value: 0,
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      color: 'green',
      route: '/admin/users?role=enseignant'
    },
    {
      title: 'Classes',
      value: 0,
      icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z',
      color: 'purple',
      route: '/admin/classes'
    },
    {
      title: 'Matières',
      value: 0,
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253',
      color: 'orange',
      route: '/admin/matieres'
    }
  ];

  recentActivities: any[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadChartData();
  }

  /**
   * Obtenir l'heure actuelle formatée
   */
  getCurrentTime(): string {
    return new Date().toLocaleTimeString('fr-FR');
  }

  /**
   * Charger les données principales du dashboard
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.updateQuickStats(stats);
        this.recentActivities = stats.activite_recente || [];
        this.isLoading = false;
        console.log('📊 Statistiques dashboard chargées:', stats);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement du dashboard:', error);
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
        this.setupFallbackData();
      }
    });
  }

  /**
   * Charger les données pour les graphiques
   */
  private loadChartData(): void {
    this.isChartsLoading = true;

    // Charger les statistiques avancées
    this.dashboardService.getAdvancedStats().subscribe({
      next: (stats) => {
        this.advancedStats = stats;
        this.setupChartData(stats);
        this.isChartsLoading = false;
        console.log('📈 Statistiques avancées chargées:', stats);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des graphiques:', error);
        this.isChartsLoading = false;
        this.setupFallbackChartData();
      }
    });
  }

  /**
   * Mettre à jour les statistiques rapides avec les vraies données
   */
  private updateQuickStats(stats: DashboardStats): void {
    if (stats.statistiques_utilisateurs) {
      this.quickStats[0].value = stats.statistiques_utilisateurs.par_role.eleve || 0;
      this.quickStats[1].value = stats.statistiques_utilisateurs.par_role.enseignant || 0;
    }
    if (stats.statistiques_classes) {
      this.quickStats[2].value = stats.statistiques_classes.total || 0;
    }
    if (stats.statistiques_matieres) {
      this.quickStats[3].value = stats.statistiques_matieres.total || 0;
    }
  }

  /**
   * Configurer les données des graphiques
   */
  private setupChartData(stats: StatistiquesAvancees): void {
    // Graphique d'évolution des inscriptions
    if (stats.evolution_inscriptions) {
      this.activityChartData = {
        labels: stats.evolution_inscriptions.map(item => item.mois),
        datasets: [{
          label: 'Nouvelles inscriptions',
          data: stats.evolution_inscriptions.map(item => item.nombre_inscriptions),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Graphique de distribution des notes
    if (stats.distribution_notes) {
      this.distributionChartData = {
        labels: stats.distribution_notes.map(item => item.tranche),
        datasets: [{
          label: 'Nombre d\'élèves',
          data: stats.distribution_notes.map(item => item.nombre_eleves),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',   // Rouge pour les faibles notes
            'rgba(245, 158, 11, 0.8)',  // Orange
            'rgba(59, 130, 246, 0.8)',  // Bleu
            'rgba(16, 185, 129, 0.8)',  // Vert pour les bonnes notes
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    }
  }

  /**
   * Données de fallback en cas d'erreur API
   */
  private setupFallbackData(): void {
    // Utiliser des données par défaut si l'API n'est pas disponible
    this.quickStats = [
      { title: 'Total Élèves', value: '--', icon: this.quickStats[0].icon, color: 'blue', route: '/admin/users?role=eleve' },
      { title: 'Enseignants', value: '--', icon: this.quickStats[1].icon, color: 'green', route: '/admin/users?role=enseignant' },
      { title: 'Classes', value: '--', icon: this.quickStats[2].icon, color: 'purple', route: '/admin/classes' },
      { title: 'Matières', value: '--', icon: this.quickStats[3].icon, color: 'orange', route: '/admin/matieres' }
    ];

    this.recentActivities = [
      {
        id: 1,
        type: 'info',
        description: 'Données en cours de chargement...',
        date: new Date().toISOString(),
        icon: 'info',
        color: 'blue'
      }
    ];
  }

  /**
   * Graphiques de fallback
   */
  private setupFallbackChartData(): void {
    this.activityChartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Données de démonstration',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4
      }]
    };

    this.distributionChartData = {
      labels: ['Aucune donnée'],
      datasets: [{
        label: 'En attente',
        data: [1],
        backgroundColor: ['rgba(156, 163, 175, 0.8)']
      }]
    };
  }

  /**
   * Obtenir la classe CSS pour la couleur
   */
  getColorClasses(color: string): { bg: string; text: string; icon: string } {
    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
      red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' }
    };
    return colorMap[color] || colorMap['blue'];
  }

  /**
   * Obtenir l'icône pour le type d'activité
   */
  getActivityIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'user-plus': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'academic-cap': 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
      'document-text': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'info': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return iconMap[type] || iconMap['info'];
  }

  /**
   * Formater la date relative
   */
  formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)} jour(s)`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return `${diffMinutes}min`;
    }
  }

  /**
   * Recharger les données
   */
  refreshData(): void {
    this.loadDashboardData();
    this.loadChartData();
  }

  /**
   * Obtenir le nom de l'utilisateur connecté
   */
  getUserName(): string {
    return this.authService.getUserFullName();
  }
}