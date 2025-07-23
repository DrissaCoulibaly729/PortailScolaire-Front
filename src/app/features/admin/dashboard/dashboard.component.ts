// ===== src/app/features/admin/dashboard/dashboard.component.ts =====
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { DashboardStats, StatistiquesAvancees } from '../../../shared/models/dashboard.model';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';

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
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  dashboardStats: DashboardStats | null = null;
  error: string | null = null;

  // Données mockées pour le développement
  quickStats: QuickStatCard[] = [
    {
      title: 'Total Élèves',
      value: 284,
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      color: 'blue',
      route: '/admin/users?role=eleve',
      change: { value: 12, type: 'increase' }
    },
    {
      title: 'Enseignants',
      value: 18,
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      color: 'green',
      route: '/admin/users?role=enseignant',
      change: { value: 2, type: 'increase' }
    },
    {
      title: 'Classes',
      value: 12,
      icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z',
      color: 'purple',
      route: '/admin/classes',
      change: { value: 0, type: 'increase' }
    },
    {
      title: 'Matières',
      value: 8,
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253',
      color: 'orange',
      route: '/admin/matieres'
    }
  ];

  recentActivities = [
    {
      id: 1,
      type: 'inscription',
      description: 'Nouvel élève inscrit: Marie Dupont',
      date: '2024-01-15T10:30:00Z',
      icon: 'user-plus',
      color: 'green'
    },
    {
      id: 2,
      type: 'note_saisie',
      description: 'Notes de Mathématiques saisies pour la 3ème A',
      date: '2024-01-15T09:15:00Z',
      icon: 'academic-cap',
      color: 'blue'
    },
    {
      id: 3,
      type: 'bulletin_genere',
      description: 'Bulletins générés pour le 1er trimestre',
      date: '2024-01-15T08:45:00Z',
      icon: 'document-text',
      color: 'purple'
    }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Charger les données du dashboard
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // Simuler un appel API (remplacer par un vrai appel)
    setTimeout(() => {
      try {
        // En développement, utiliser des données mockées
        this.setupMockData();
        this.isLoading = false;
      } catch (error) {
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
      }
    }, 1000);

    // TODO: Remplacer par un vrai appel API
    /*
    this.apiService.get<DashboardStats>(API_ENDPOINTS.ADMIN.DASHBOARD).subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.updateQuickStats(stats);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
      }
    });
    */
  }

  /**
   * Configuration des données mockées
   */
  private setupMockData(): void {
    // Simule la réponse de l'API
    this.dashboardStats = {
      statistiques_utilisateurs: {
        total: 320,
        par_role: {
          administrateur: 2,
          enseignant: 18,
          eleve: 284
        },
        actifs: 315,
        inactifs: 5
      },
      statistiques_classes: {
        total: 12,
        effectif_total: 284,
        taux_occupation: 85.2
      },
      statistiques_matieres: {
        total: 8,
        notes_saisies: 1247
      },
      activite_recente: [],
      eleves_en_difficulte: [],
      excellents_eleves: []
    };
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
    return colorMap[color] || colorMap[color];
  }

  /**
   * Obtenir l'icône pour le type d'activité
   */
  getActivityIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'user-plus': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'academic-cap': 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
      'document-text': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    };
    return iconMap[type] || iconMap['document-text'];
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
  }

  /**
   * Obtenir le nom de l'utilisateur connecté
   */
  getUserName(): string {
    return this.authService.getUserFullName();
  }
}