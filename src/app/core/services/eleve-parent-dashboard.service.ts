// src/app/core/services/eleve-parent-dashboard.service.ts

import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { 
  DashboardData, 
  EnfantSummary, 
  MoyenneMatiere,
  EvenementRecent,
  DashboardFilters,
  PerformanceEvolution 
} from '../../shared/models/eleve-parent-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class EleveParentDashboardService {
  private dashboardDataSubject = new BehaviorSubject<DashboardData | null>(null);
  public dashboardData$ = this.dashboardDataSubject.asObservable();

  constructor(private apiService: ApiService) {}

  /**
   * Récupère les données complètes du dashboard pour un parent
   */
  getDashboardData(userId: number): Observable<DashboardData> {
    // En production, remplacer par un appel API réel
    return this.getMockDashboardData(userId).pipe(
      delay(1000), // Simulation du temps de chargement
      map(data => {
        this.dashboardDataSubject.next(data);
        return data;
      }),
      catchError(error => {
        console.error('Erreur lors du chargement du dashboard:', error);
        throw error;
      })
    );
  }

  /**
   * Actualise les données du dashboard
   */
  refreshDashboardData(userId: number): Observable<DashboardData> {
    return this.getDashboardData(userId);
  }

  /**
   * Récupère les détails d'un enfant spécifique
   */
  getEnfantDetails(enfantId: number): Observable<EnfantSummary> {
    // En production: return this.apiService.get<EnfantSummary>(`/parents/enfants/${enfantId}`);
    return this.getMockEnfantDetails(enfantId).pipe(delay(500));
  }

  /**
   * Récupère l'évolution des performances d'un enfant
   */
  getPerformanceEvolution(enfantId: number, periode?: string): Observable<PerformanceEvolution> {
    // En production: return this.apiService.get<PerformanceEvolution>(`/parents/enfants/${enfantId}/evolution`);
    return this.getMockPerformanceEvolution(enfantId).pipe(delay(300));
  }

  /**
   * Marque les alertes comme lues
   */
  marquerAlertesCommeVues(alerteIds: string[]): Observable<boolean> {
    // En production: return this.apiService.post<boolean>('/parents/alertes/mark-read', { alerteIds });
    return of(true).pipe(delay(200));
  }

  /**
   * Génère des données mock pour le développement
   */
  private getMockDashboardData(userId: number): Observable<DashboardData> {
    const mockData: DashboardData = {
      statistiques: {
        totalEnfants: 2,
        moyenneGeneraleGlobale: 13.75,
        bulletinsDisponibles: 4,
        prochainConseil: '2024-03-15'
      },
      enfants: [
        {
          eleve: {
            id: 1,
            nom: 'Diallo',
            prenom: 'Aminata',
            numero_etudiant: 'E2024001',
            classe: {
              id: 1,
              nom: '6ème A',
              niveau: '6ème'
            }
          },
          moyenneActuelle: {
            moyenne_generale: 14.5,
            mention: 'Bien',
            rang_classe: 5,
            coefficient_total: 28,
            nombre_notes: 15
          },
          dernierBulletin: {
            id: 1,
            periode_nom: '2ème Trimestre',
            moyenne_generale: 14.5,
            mention: 'Bien',
            pdf_url: '/api/bulletins/1/download',
            date_creation: '2024-02-28'
          },
          moyennesParMatiere: [
            { matiere_id: 1, matiere_nom: 'Mathématiques', moyenne: 13.5, nombre_notes: 4, coefficient: 4 },
            { matiere_id: 2, matiere_nom: 'Français', moyenne: 15.2, nombre_notes: 3, coefficient: 4 },
            { matiere_id: 3, matiere_nom: 'Histoire-Géographie', moyenne: 14.8, nombre_notes: 2, coefficient: 3 },
            { matiere_id: 4, matiere_nom: 'Sciences', moyenne: 13.0, nombre_notes: 3, coefficient: 3 },
            { matiere_id: 5, matiere_nom: 'Anglais', moyenne: 16.0, nombre_notes: 3, coefficient: 2 }
          ],
          alertes: ['Excellents résultats en Anglais', 'Attention en Mathématiques'],
          progressionMensuelle: [
            { mois: 'Octobre', moyenne: 13.2 },
            { mois: 'Novembre', moyenne: 13.8 },
            { mois: 'Décembre', moyenne: 14.1 },
            { mois: 'Janvier', moyenne: 14.5 }
          ]
        },
        {
          eleve: {
            id: 2,
            nom: 'Diallo',
            prenom: 'Ibrahima',
            numero_etudiant: 'E2024002',
            classe: {
              id: 2,
              nom: '4ème B',
              niveau: '4ème'
            }
          },
          moyenneActuelle: {
            moyenne_generale: 13.0,
            mention: 'Assez bien',
            rang_classe: 12,
            coefficient_total: 32,
            nombre_notes: 18
          },
          dernierBulletin: {
            id: 2,
            periode_nom: '2ème Trimestre',
            moyenne_generale: 13.0,
            mention: 'Assez bien',
            pdf_url: '/api/bulletins/2/download',
            date_creation: '2024-02-28'
          },
          moyennesParMatiere: [
            { matiere_id: 1, matiere_nom: 'Mathématiques', moyenne: 11.5, nombre_notes: 5, coefficient: 4 },
            { matiere_id: 2, matiere_nom: 'Français', moyenne: 13.8, nombre_notes: 4, coefficient: 4 },
            { matiere_id: 3, matiere_nom: 'Histoire-Géographie', moyenne: 14.2, nombre_notes: 3, coefficient: 3 },
            { matiere_id: 4, matiere_nom: 'Sciences Physiques', moyenne: 12.0, nombre_notes: 4, coefficient: 4 },
            { matiere_id: 5, matiere_nom: 'Anglais', moyenne: 15.5, nombre_notes: 2, coefficient: 2 }
          ],
          alertes: ['Difficultés en Mathématiques', 'Progrès en Français'],
          progressionMensuelle: [
            { mois: 'Octobre', moyenne: 12.1 },
            { mois: 'Novembre', moyenne: 12.5 },
            { mois: 'Décembre', moyenne: 12.8 },
            { mois: 'Janvier', moyenne: 13.0 }
          ]
        }
      ],
      derniersEvenements: [
        {
          id: '1',
          type: 'note',
          titre: 'Nouvelle note en Mathématiques',
          description: 'Note de contrôle: 16/20 pour Aminata',
          date: '2024-02-20T10:30:00Z',
          urgent: false,
          enfant_id: 1,
          enfant_nom: 'Aminata'
        },
        {
          id: '2',
          type: 'bulletin',
          titre: 'Bulletin disponible',
          description: 'Le bulletin du 2ème trimestre est disponible',
          date: '2024-02-28T08:00:00Z',
          urgent: false
        },
        {
          id: '3',
          type: 'conseil',
          titre: 'Conseil de classe',
          description: 'Conseil de classe prévu le 15 mars 2024',
          date: '2024-02-25T14:00:00Z',
          urgent: true
        }
      ],
      alertesUrgentes: [
        {
          id: 'a1',
          type: 'note_faible',
          message: 'Note en dessous de la moyenne en Mathématiques pour Ibrahima',
          enfant_id: 2,
          enfant_nom: 'Ibrahima',
          date_creation: '2024-02-18T09:00:00Z',
          resolu: false
        }
      ]
    };

    return of(mockData);
  }

  private getMockEnfantDetails(enfantId: number): Observable<EnfantSummary> {
    const mockData = this.getMockDashboardData(1);
    return mockData.pipe(
      map(data => data.enfants.find(e => e.eleve.id === enfantId)!),
      map(enfant => enfant || this.getDefaultEnfant(enfantId))
    );
  }

  private getMockPerformanceEvolution(enfantId: number): Observable<PerformanceEvolution> {
    const mockData: PerformanceEvolution = {
      enfant_id: enfantId,
      donnees: [
        { periode: 'Septembre', moyenne: 12.5, rang: 8, total_eleves: 28 },
        { periode: 'Octobre', moyenne: 13.2, rang: 6, total_eleves: 28 },
        { periode: 'Novembre', moyenne: 13.8, rang: 5, total_eleves: 28 },
        { periode: 'Décembre', moyenne: 14.1, rang: 5, total_eleves: 28 },
        { periode: 'Janvier', moyenne: 14.5, rang: 4, total_eleves: 28 }
      ]
    };
    return of(mockData);
  }

  private getDefaultEnfant(enfantId: number): EnfantSummary {
    return {
      eleve: {
        id: enfantId,
        nom: 'Inconnu',
        prenom: 'Inconnu',
        numero_etudiant: 'E0000000'
      },
      alertes: [],
      moyennesParMatiere: []
    };
  }
}