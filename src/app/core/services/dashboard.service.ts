// ===== src/app/core/services/dashboard.service.ts =====
import { Injectable } from '@angular/core';
import { Observable, of, combineLatest, forkJoin } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

// ========================================
// INTERFACES POUR LE DASHBOARD - ADAPTÉES À L'API LARAVEL
// ========================================

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

export interface StatistiquesAvancees {
  repartition_mentions: Array<{
    mention: string;
    nombre: number;
    pourcentage: number;
    couleur: string;
  }>;
  evolution_mensuelle: Array<{
    mois: string;
    notes: number;
    moyenne: number;
  }>;
  top_matieres: Array<{
    matiere: string;
    moyenne: number;
    nb_notes: number;
  }>;
  classes_performantes: Array<{
    classe: string;
    moyenne: number;
    effectif: number;
  }>;
}

export interface ActivityData {
  date: string;
  type: 'inscription' | 'note' | 'bulletin' | 'connexion';
  count: number;
  details?: {
    nouveaux_eleves?: number;
    nouveaux_enseignants?: number;
    notes_saisies?: number;
    bulletins_generes?: number;
    connexions_uniques?: number;
  };
}

export interface ClassDistributionData {
  classe_id: number;
  classe_nom: string;
  niveau: string;
  effectif: number;
  pourcentage: number;
  moyenne_generale: number;
  taux_reussite: number;
  couleur?: string;
}

export interface RegistrationTrendData {
  periode: string;
  eleves: number;
  enseignants: number;
  total: number;
  evolution: {
    eleves: number;
    enseignants: number;
    total: number;
  };
}

export interface PerformanceGeneraleData {
  moyenne_etablissement: number;
  evolution_moyenne: number;
  taux_reussite_global: number;
  evolution_reussite: number;
  notes_ce_mois: number;
  bulletins_ce_mois: number;
  objectifs_atteints: number;
  alertes_actives: number;
}

export interface DashboardFilters {
  periode?: 'semaine' | 'mois' | 'trimestre' | 'annee';
  classe_id?: number;
  niveau?: string;
  date_debut?: string;
  date_fin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private apiService: ApiService) { }

  /**
   * Récupérer les statistiques principales du dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.apiService.get<DashboardStats>(API_ENDPOINTS.ADMIN.DASHBOARD).pipe(
      tap(stats => console.log('📊 Statistiques dashboard:', stats)),
      catchError(error => {
        console.error('❌ Erreur récupération stats dashboard:', error);
        return this.getMockDashboardStats();
      }),
      shareReplay(1)
    );
  }

  /**
   * Récupérer les statistiques avancées pour les graphiques
   */
  getAdvancedStats(): Observable<StatistiquesAvancees> {
    return this.apiService.get<StatistiquesAvancees>(API_ENDPOINTS.ADMIN.STATS_AVANCEES).pipe(
      tap(stats => console.log('📈 Statistiques avancées:', stats)),
      catchError(error => {
        console.error('❌ Erreur récupération stats avancées:', error);
        return this.getMockAdvancedStats();
      }),
      shareReplay(1)
    );
  }

  /**
   * ✅ CORRIGÉ: Récupérer les données pour le graphique d'activité mensuelle
   */
  getMonthlyActivity(): Observable<ActivityData[]> {
    return this.apiService.get<any>(API_ENDPOINTS.ADMIN.ACTIVITE_MENSUELLE).pipe(
      map((response: any) => {
        console.log('📅 Activité mensuelle:', response);
        
        if (Array.isArray(response)) return response as ActivityData[];
        if (response.data && Array.isArray(response.data)) return response.data as ActivityData[];
        if (response.activites && Array.isArray(response.activites)) return response.activites as ActivityData[];
        
        return [] as ActivityData[];
      }),
      catchError(error => {
        console.error('❌ Erreur récupération activité mensuelle:', error);
        return of(this.getMockActivityData());
      })
    );
  }

  /**
   * ✅ CORRIGÉ: Récupérer les données de répartition par classe
   */
  getClassDistribution(): Observable<ClassDistributionData[]> {
    return this.apiService.get<any>(API_ENDPOINTS.ADMIN.REPARTITION_CLASSES).pipe(
      map((response: any) => {
        console.log('🏫 Répartition classes:', response);
        
        if (Array.isArray(response)) return response as ClassDistributionData[];
        if (response.data && Array.isArray(response.data)) return response.data as ClassDistributionData[];
        if (response.classes && Array.isArray(response.classes)) return response.classes as ClassDistributionData[];
        
        return [] as ClassDistributionData[];
      }),
      catchError(error => {
        console.error('❌ Erreur récupération répartition classes:', error);
        return of(this.getMockClassDistribution());
      })
    );
  }

  /**
   * ✅ CORRIGÉ: Récupérer l'évolution des inscriptions
   */
  getRegistrationTrend(): Observable<RegistrationTrendData[]> {
    return this.apiService.get<any>(API_ENDPOINTS.ADMIN.EVOLUTION_INSCRIPTIONS).pipe(
      map((response: any) => {
        console.log('📈 Évolution inscriptions:', response);
        
        if (Array.isArray(response)) return response as RegistrationTrendData[];
        if (response.data && Array.isArray(response.data)) return response.data as RegistrationTrendData[];
        if (response.evolution && Array.isArray(response.evolution)) return response.evolution as RegistrationTrendData[];
        
        return [] as RegistrationTrendData[];
      }),
      catchError(error => {
        console.error('❌ Erreur récupération évolution inscriptions:', error);
        return of(this.getMockRegistrationTrend());
      })
    );
  }

  /**
   * ✅ NOUVEAU: Récupérer les performances générales
   */
  getPerformanceGenerale(): Observable<PerformanceGeneraleData> {
    return this.apiService.get<any>(API_ENDPOINTS.ADMIN.PERFORMANCE_GENERALE).pipe(
      map((response: any) => {
        console.log('🎯 Performance générale:', response);
        
        if (response.data) return response.data as PerformanceGeneraleData;
        return response as PerformanceGeneraleData;
      }),
      catchError(error => {
        console.error('❌ Erreur récupération performance générale:', error);
        return of(this.getMockPerformanceGenerale());
      })
    );
  }

  /**
   * ✅ NOUVEAU: Récupérer toutes les données du dashboard en une fois
   */
  getAllDashboardData(filters?: DashboardFilters): Observable<{
    stats: DashboardStats;
    advancedStats: StatistiquesAvancees;
    monthlyActivity: ActivityData[];
    classDistribution: ClassDistributionData[];
    registrationTrend: RegistrationTrendData[];
    performanceGenerale: PerformanceGeneraleData;
  }> {
    return forkJoin({
      stats: this.getDashboardStats(),
      advancedStats: this.getAdvancedStats(),
      monthlyActivity: this.getMonthlyActivity(),
      classDistribution: this.getClassDistribution(),
      registrationTrend: this.getRegistrationTrend(),
      performanceGenerale: this.getPerformanceGenerale()
    }).pipe(
      tap(data => console.log('🎯 Toutes les données dashboard récupérées:', data)),
      catchError(error => {
        console.error('❌ Erreur récupération complète dashboard:', error);
        throw error;
      })
    );
  }

  /**
   * ✅ NOUVEAU: Récupérer les données avec filtres personnalisés
   */
  getDashboardDataWithFilters(filters: DashboardFilters): Observable<any> {
    const endpoint = this.buildFilteredEndpoint(API_ENDPOINTS.ADMIN.DASHBOARD, filters);
    
    return this.apiService.get<any>(endpoint).pipe(
      tap(data => console.log('🔍 Dashboard avec filtres:', data)),
      catchError(error => {
        console.error('❌ Erreur dashboard avec filtres:', error);
        return of(null);
      })
    );
  }

  /**
   * ✅ NOUVEAU: Rafraîchir les données du dashboard
   */
  refreshDashboard(): Observable<boolean> {
    return this.apiService.post<any>(`${API_ENDPOINTS.ADMIN.DASHBOARD}/refresh`, {}).pipe(
      map((response: any) => {
        console.log('🔄 Dashboard rafraîchi:', response);
        return response.success || true;
      }),
      catchError(error => {
        console.error('❌ Erreur rafraîchissement dashboard:', error);
        return of(false);
      })
    );
  }

  /**
   * ✅ NOUVEAU: Exporter les données du dashboard
   */
  exportDashboardData(format: 'pdf' | 'excel' = 'pdf', filters?: DashboardFilters): Observable<Blob> {
    // ✅ CORRIGÉ: Convertir tous les paramètres en string pour HttpParams
    const stringParams: Record<string, string> = { format };
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          stringParams[key] = String(value);
        }
      });
    }
    
    const endpoint = `${API_ENDPOINTS.ADMIN.DASHBOARD}/export`;
    
    return this.apiService.get<Blob>(endpoint, { 
      params: stringParams,
      skipApiResponseWrapper: true,
      headers: { 'Accept': 'application/octet-stream' }
    }).pipe(
      tap(() => console.log('📥 Export dashboard généré')),
      catchError(error => {
        console.error('❌ Erreur export dashboard:', error);
        throw error;
      })
    );
  }

  /**
   * ✅ NOUVEAU: Obtenir les alertes du dashboard
   */
  getDashboardAlerts(): Observable<Array<{
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: string;
    action?: string;
  }>> {
    return this.apiService.get<any>(`${API_ENDPOINTS.ADMIN.DASHBOARD}/alertes`).pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response;
        if (response.data && Array.isArray(response.data)) return response.data;
        if (response.alertes && Array.isArray(response.alertes)) return response.alertes;
        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur récupération alertes:', error);
        return of([]);
      })
    );
  }

  // ========================================
  // MÉTHODES PRIVÉES ET UTILITAIRES
  // ========================================

  /**
   * Construire un endpoint avec des filtres
   */
  private buildFilteredEndpoint(baseEndpoint: string, filters: DashboardFilters): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, String(value)); // ✅ CORRIGÉ: Conversion explicite en string
      }
    });
    
    return params.toString() ? `${baseEndpoint}?${params.toString()}` : baseEndpoint;
  }

  /**
   * ✅ CORRIGÉ: Données mock pour les stats principales (format API Laravel)
   */
  private getMockDashboardStats(): Observable<DashboardStats> {
    const mockStats: DashboardStats = {
      message: "Données du tableau de bord récupérées avec succès",
      statut: "succes",
      tableau_bord: {
        utilisateurs: {
          total: 8,
          administrateurs: 1,
          enseignants: 4,
          eleves: 3,
          actifs: 7,
          inactifs: 1,
          nouveaux_ce_mois: 3,
          repartition_par_role: {
            eleve: 3,
            enseignant: 4,
            administrateur: 1
          }
        },
        classes: {
          total: 5,
          actives: 5,
          inactives: 0,
          effectif_total: 3,
          capacite_totale: 190,
          taux_occupation: 1.58,
          repartition_par_niveau: [
            { niveau: '6ème', nb_classes: 2, capacite: 70, eleves_count: 2 },
            { niveau: '5ème', nb_classes: 1, capacite: 40, eleves_count: 0 },
            { niveau: '4ème', nb_classes: 1, capacite: 40, eleves_count: 0 },
            { niveau: 'Terminal', nb_classes: 1, capacite: 40, eleves_count: 1 }
          ],
          classes_pleines: 0
        },
        matieres: {
          total: 7,
          actives: 7,
          inactives: 0,
          avec_enseignants: 7,
          sans_enseignants: 0,
          coefficient_moyen: 2.29,
          repartition_coefficients: [
            { coefficient: "1", nombre: 2 },
            { coefficient: "2", nombre: 2 },
            { coefficient: "3", nombre: 3 }
          ]
        },
        academique: {
          moyennes_par_classe: [],
          moyenne_generale_ecole: 0,
          nb_notes_total: 0,
          notes_ce_mois: 0,
          eleves_en_difficulte: [],
          excellents_eleves: []
        },
        bulletins: {
          total_generes: 0,
          disponibles: 0,
          en_attente: 0,
          generes_ce_mois: 0,
          repartition_mentions: []
        },
        activite_recente: {
          derniers_utilisateurs: [
            {
              id: 1,
              nom: "Coulibaly",
              prenom: "Drissa",
              role: "eleve",
              created_at: "2025-07-27T22:53:28.000000Z"
            }
          ],
          dernieres_notes: [],
          derniers_bulletins: [],
          connexions_recentes: [
            {
              id: 1,
              nom: "Coulibaly",
              prenom: "Drissa",
              role: "eleve",
              updated_at: "2025-07-30T10:15:00.000000Z"
            }
          ]
        }
      }
    };
    
    return of(mockStats);
  }

  /**
   * Données mock pour les stats avancées (fallback)
   */
  private getMockAdvancedStats(): Observable<StatistiquesAvancees> {
    const mockAdvanced: StatistiquesAvancees = {
      repartition_mentions: [
        { mention: 'Très Bien', nombre: 45, pourcentage: 18.4, couleur: '#22c55e' },
        { mention: 'Bien', nombre: 87, pourcentage: 35.5, couleur: '#3b82f6' },
        { mention: 'Assez Bien', nombre: 78, pourcentage: 31.8, couleur: '#f59e0b' },
        { mention: 'Passable', nombre: 35, pourcentage: 14.3, couleur: '#ef4444' }
      ],
      evolution_mensuelle: [
        { mois: 'Janvier', notes: 1200, moyenne: 14.2 },
        { mois: 'Février', notes: 1150, moyenne: 14.5 },
        { mois: 'Mars', notes: 1300, moyenne: 14.1 }
      ],
      top_matieres: [
        { matiere: 'Mathématiques', moyenne: 15.2, nb_notes: 450 },
        { matiere: 'Français', moyenne: 14.8, nb_notes: 420 },
        { matiere: 'Histoire', moyenne: 14.5, nb_notes: 380 }
      ],
      classes_performantes: [
        { classe: '6ème A', moyenne: 15.1, effectif: 25 },
        { classe: '5ème B', moyenne: 14.9, effectif: 23 },
        { classe: '4ème C', moyenne: 14.7, effectif: 24 }
      ]
    };
    
    return of(mockAdvanced);
  }

  /**
   * Données mock pour l'activité mensuelle
   */
  private getMockActivityData(): ActivityData[] {
    return [
      {
        date: '2024-01',
        type: 'inscription',
        count: 25,
        details: { nouveaux_eleves: 20, nouveaux_enseignants: 5 }
      },
      {
        date: '2024-02',
        type: 'note',
        count: 450,
        details: { notes_saisies: 450 }
      },
      {
        date: '2024-03',
        type: 'bulletin',
        count: 180,
        details: { bulletins_generes: 180 }
      }
    ];
  }

  /**
   * Données mock pour la répartition des classes
   */
  private getMockClassDistribution(): ClassDistributionData[] {
    return [
      {
        classe_id: 1,
        classe_nom: '6ème A',
        niveau: '6ème',
        effectif: 25,
        pourcentage: 20.4,
        moyenne_generale: 14.5,
        taux_reussite: 92.0,
        couleur: '#3b82f6'
      },
      {
        classe_id: 2,
        classe_nom: '5ème B',
        niveau: '5ème',
        effectif: 23,
        pourcentage: 18.7,
        moyenne_generale: 13.8,
        taux_reussite: 87.0,
        couleur: '#22c55e'
      }
    ];
  }

  /**
   * Données mock pour l'évolution des inscriptions
   */
  private getMockRegistrationTrend(): RegistrationTrendData[] {
    return [
      {
        periode: '2024-01',
        eleves: 240,
        enseignants: 18,
        total: 258,
        evolution: { eleves: 2.1, enseignants: 0.0, total: 1.9 }
      },
      {
        periode: '2024-02',
        eleves: 245,
        enseignants: 18,
        total: 263,
        evolution: { eleves: 2.1, enseignants: 0.0, total: 1.9 }
      }
    ];
  }

  /**
   * Données mock pour la performance générale
   */
  private getMockPerformanceGenerale(): PerformanceGeneraleData {
    return {
      moyenne_etablissement: 14.2,
      evolution_moyenne: 0.8,
      taux_reussite_global: 87.5,
      evolution_reussite: 2.3,
      notes_ce_mois: 1250,
      bulletins_ce_mois: 185,
      objectifs_atteints: 78,
      alertes_actives: 3
    };
  }
}