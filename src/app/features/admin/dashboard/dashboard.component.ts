// ===== src/app/features/admin/dashboard/dashboard.component.ts =====

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { DashboardService, DashboardStats } from '../../../core/services/dashboard.service';

// ✅ INTERFACES LOCALES (DashboardStats importée du service, pas redéfinie ici)
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
  templateUrl: './dashboard.component.html',
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
   * ✅ CORRIGÉ: Charger toutes les données du dashboard - Syntaxe subscribe corrigée
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getDashboardStats().pipe(
      catchError((error: any) => {
        console.error('❌ Erreur lors du chargement du dashboard:', error);
        this.error = 'Impossible de charger les données du dashboard';
        return of(null);
      })
    ).subscribe(data => {
      // ✅ CORRIGÉ: Syntaxe simple sans objet { next: ... }
      console.log('📊 Données reçues:', data);
      
      if (data && data.tableau_bord) {
        console.log('✅ Construction des données dashboard...');
        this.buildStatCards(data);
        this.buildRecentActivities(data);
        this.buildSystemAlerts(data);
        this.buildNiveauxData(data);
      } else {
        console.log('⚠️ Aucune donnée reçue, chargement des données mock...');
        this.loadMockData();
      }
      
      this.isLoading = false;
      console.log('✅ Chargement dashboard terminé');
    });
  }

  /**
   * Construire les cartes de statistiques
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
   * Construire les activités récentes
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
   * Construire les alertes système
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
    console.log('🔄 Génération de rapport en cours...');
    // TODO: Implémentez votre logique de génération de rapport
    // Exemple: this.dashboardService.exportDashboardData('pdf').subscribe(...)
  }
}