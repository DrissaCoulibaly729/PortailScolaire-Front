// src/app/core/services/statistiques.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';

import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiResponse } from '../../shared/models/api-response.model';

// Interfaces pour les statistiques
export interface StatistiquesGenerales {
  total_notes: number;
  moyenne_generale: number;
  notes_ce_mois: number;
  evolution_mois: number;
  repartition_mentions: MentionStat[];
  progression_annuelle: number;
  objectifs_atteints: number;
}

export interface MentionStat {
  mention: string;
  nombre: number;
  pourcentage: number;
  couleur: string;
  evolution?: number;
}

export interface PerformanceClasse {
  classe_id: number;
  classe_nom: string;
  niveau: string;
  moyenne: number;
  evolution: number;
  nb_eleves: number;
  nb_notes: number;
  taux_reussite: number;
  eleves_en_difficulte: number;
}

export interface EvolutionNote {
  date: string;
  moyenne: number;
  nombre_notes: number;
  mediane?: number;
  ecart_type?: number;
}

export interface StatistiqueMatiere {
  matiere_id: number;
  matiere: string;
  moyenne: number;
  nb_notes: number;
  meilleure_note: number;
  note_la_plus_basse: number;
  ecart_type: number;
  coefficient: number;
  progression: number;
  objectif_atteint: boolean;
}

export interface ComparaisonPeriode {
  periode_actuelle: {
    nom: string;
    moyenne: number;
    nb_notes: number;
    date_debut: string;
    date_fin: string;
  };
  periode_precedente: {
    nom: string;
    moyenne: number;
    nb_notes: number;
    date_debut: string;
    date_fin: string;
  };
  evolution: {
    moyenne: number;
    nb_notes: number;
    pourcentage: number;
    tendance: 'hausse' | 'baisse' | 'stable';
  };
}

export interface StatistiqueEleve {
  eleve_id: number;
  eleve_nom: string;
  eleve_prenom: string;
  classe: string;
  moyenne_generale: number;
  evolution: number;
  nb_notes: number;
  rang: number;
  points_forts: string[];
  points_faibles: string[];
  recommandations: string[];
  statut: 'excellent' | 'bon' | 'moyen' | 'difficulte' | 'alerte';
}

export interface RapportStatistique {
  id: string;
  titre: string;
  type: 'classe' | 'matiere' | 'periode' | 'eleve' | 'general';
  description: string;
  donnees: any;
  graphiques: GraphiqueData[];
  date_generation: string;
  parametres: any;
}

export interface GraphiqueData {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  titre: string;
  donnees: any[];
  options?: any;
}

export interface FiltresStatistiques {
  periode?: 'mois' | 'trimestre' | 'semestre' | 'annee';
  classe_id?: number;
  matiere_id?: number;
  date_debut?: string;
  date_fin?: string;
  type_evaluation?: string;
  niveau?: string;
  grouper_par?: 'classe' | 'matiere' | 'niveau' | 'date';
}

@Injectable({
  providedIn: 'root'
})
export class StatistiquesService {
  
  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  /**
   * Obtenir les statistiques générales de l'enseignant
   */
  getStatistiquesGenerales(filtres?: FiltresStatistiques): Observable<StatistiquesGenerales> {
    let params = new HttpParams();
    
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ApiResponse<StatistiquesGenerales>>(
      API_ENDPOINTS.STATISTIQUES.GENERALES,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors du chargement des statistiques générales:', error);
        return this.getMockStatistiquesGenerales();
      })
    );
  }

  /**
   * Obtenir les performances par classe
   */
  getPerformanceClasses(filtres?: FiltresStatistiques): Observable<PerformanceClasse[]> {
    let params = new HttpParams();
    
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ApiResponse<PerformanceClasse[]>>(
      API_ENDPOINTS.STATISTIQUES.CLASSES,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors du chargement des performances par classe:', error);
        return this.getMockPerformanceClasses();
      })
    );
  }

  /**
   * Obtenir l'évolution des notes dans le temps
   */
  getEvolutionNotes(filtres?: FiltresStatistiques): Observable<EvolutionNote[]> {
    let params = new HttpParams();
    
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ApiResponse<EvolutionNote[]>>(
      API_ENDPOINTS.STATISTIQUES.EVOLUTION,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors du chargement de l\'évolution:', error);
        return this.getMockEvolutionNotes();
      })
    );
  }

  /**
   * Obtenir les statistiques par matière
   */
  getStatistiquesMatieres(filtres?: FiltresStatistiques): Observable<StatistiqueMatiere[]> {
    let params = new HttpParams();
    
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ApiResponse<StatistiqueMatiere[]>>(
      API_ENDPOINTS.STATISTIQUES.MATIERES,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors du chargement des statistiques par matière:', error);
        return this.getMockStatistiquesMatieres();
      })
    );
  }

  /**
   * Comparer deux périodes
   */
  comparerPeriodes(
    periode1: { debut: string; fin: string },
    periode2: { debut: string; fin: string },
    filtres?: FiltresStatistiques
  ): Observable<ComparaisonPeriode> {
    let params = new HttpParams()
      .set('periode1_debut', periode1.debut)
      .set('periode1_fin', periode1.fin)
      .set('periode2_debut', periode2.debut)
      .set('periode2_fin', periode2.fin);

    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ApiResponse<ComparaisonPeriode>>(
      API_ENDPOINTS.STATISTIQUES.COMPARAISON,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors de la comparaison de périodes:', error);
        return this.getMockComparaisonPeriodes();
      })
    );
  }

  /**
   * Obtenir les statistiques d'un élève spécifique
   */
  getStatistiquesEleve(eleveId: number, filtres?: FiltresStatistiques): Observable<StatistiqueEleve> {
    let params = new HttpParams();
    
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ApiResponse<StatistiqueEleve>>(
      `${API_ENDPOINTS.STATISTIQUES.ELEVES}/${eleveId}`,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors du chargement des statistiques élève:', error);
        return this.getMockStatistiquesEleve(eleveId);
      })
    );
  }

  /**
   * Identifier les élèves en difficulté
   */
  getElevesEnDifficulte(filtres?: FiltresStatistiques): Observable<StatistiqueEleve[]> {
    let params = new HttpParams();
    
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ApiResponse<StatistiqueEleve[]>>(
      API_ENDPOINTS.STATISTIQUES.ELEVES_DIFFICULTE,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors de l\'identification des élèves en difficulté:', error);
        return this.getMockElevesEnDifficulte();
      })
    );
  }

  /**
   * Identifier les excellents élèves
   */
  getExcellentsEleves(filtres?: FiltresStatistiques): Observable<StatistiqueEleve[]> {
    let params = new HttpParams();
    
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ApiResponse<StatistiqueEleve[]>>(
      API_ENDPOINTS.STATISTIQUES.EXCELLENTS_ELEVES,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors de l\'identification des excellents élèves:', error);
        return this.getMockExcellentsEleves();
      })
    );
  }

  /**
   * Générer un rapport statistique
   */
  genererRapport(
    type: 'classe' | 'matiere' | 'periode' | 'eleve' | 'general',
    parametres: any
  ): Observable<RapportStatistique> {
    return this.apiService.post<ApiResponse<RapportStatistique>>(
      API_ENDPOINTS.STATISTIQUES.RAPPORTS,
      { type, parametres }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors de la génération du rapport:', error);
        return this.getMockRapportStatistique(type);
      })
    );
  }

  /**
   * Exporter les statistiques
   */
  exporterStatistiques(
    format: 'pdf' | 'excel' | 'csv',
    type: string,
    filtres?: FiltresStatistiques
  ): Observable<Blob> {
    let params = new HttpParams().set('format', format).set('type', type);
    
    if (filtres) {
      Object.entries(filtres).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(
      API_ENDPOINTS.STATISTIQUES.EXPORT,
      { 
        params,
        responseType: 'blob'
      }
    );
  }

  /**
   * Calculer les moyennes sur une période
   */
  calculerMoyennes(
    classeIds: number[],
    dateDebut: string,
    dateFin: string
  ): Observable<{ [classeId: number]: number }> {
    return this.apiService.post<ApiResponse<{ [classeId: number]: number }>>(
      API_ENDPOINTS.STATISTIQUES.CALCUL_MOYENNES,
      { classe_ids: classeIds, date_debut: dateDebut, date_fin: dateFin }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Erreur lors du calcul des moyennes:', error);
        return of({});
      })
    );
  }

  // ===== MÉTHODES PRIVÉES - DONNÉES MOCK =====

  private getMockStatistiquesGenerales(): Observable<StatistiquesGenerales> {
    const mockData: StatistiquesGenerales = {
      total_notes: 347,
      moyenne_generale: 13.8,
      notes_ce_mois: 89,
      evolution_mois: 12.5,
      progression_annuelle: 85,
      objectifs_atteints: 78,
      repartition_mentions: [
        { mention: 'Très bien', nombre: 45, pourcentage: 13, couleur: '#10b981', evolution: 2.3 },
        { mention: 'Bien', nombre: 78, pourcentage: 22, couleur: '#3b82f6', evolution: 1.8 },
        { mention: 'Assez bien', nombre: 124, pourcentage: 36, couleur: '#f59e0b', evolution: -0.5 },
        { mention: 'Passable', nombre: 67, pourcentage: 19, couleur: '#f97316', evolution: -1.2 },
        { mention: 'Insuffisant', nombre: 33, pourcentage: 10, couleur: '#ef4444', evolution: -2.4 }
      ]
    };

    return of(mockData).pipe(delay(1000));
  }

  private getMockPerformanceClasses(): Observable<PerformanceClasse[]> {
    const mockData: PerformanceClasse[] = [
      {
        classe_id: 1,
        classe_nom: '6ème A',
        niveau: '6ème',
        moyenne: 14.2,
        evolution: 2.1,
        nb_eleves: 28,
        nb_notes: 145,
        taux_reussite: 89,
        eleves_en_difficulte: 2
      },
      {
        classe_id: 2,
        classe_nom: '5ème B',
        niveau: '5ème',
        moyenne: 13.8,
        evolution: -0.5,
        nb_eleves: 26,
        nb_notes: 132,
        taux_reussite: 85,
        eleves_en_difficulte: 3
      },
      {
        classe_id: 3,
        classe_nom: 'Terminale C',
        niveau: 'Terminale',
        moyenne: 12.5,
        evolution: 1.8,
        nb_eleves: 24,
        nb_notes: 98,
        taux_reussite: 75,
        eleves_en_difficulte: 5
      }
    ];

    return of(mockData).pipe(delay(1200));
  }

  private getMockEvolutionNotes(): Observable<EvolutionNote[]> {
    const mockData: EvolutionNote[] = [
      { date: '2024-01-01', moyenne: 13.2, nombre_notes: 12, mediane: 13.0, ecart_type: 2.8 },
      { date: '2024-01-03', moyenne: 13.5, nombre_notes: 18, mediane: 13.3, ecart_type: 2.6 },
      { date: '2024-01-05', moyenne: 14.1, nombre_notes: 25, mediane: 14.0, ecart_type: 2.9 },
      { date: '2024-01-08', moyenne: 13.8, nombre_notes: 15, mediane: 13.7, ecart_type: 3.1 },
      { date: '2024-01-10', moyenne: 14.3, nombre_notes: 22, mediane: 14.2, ecart_type: 2.7 },
      { date: '2024-01-12', moyenne: 13.9, nombre_notes: 19, mediane: 13.8, ecart_type: 2.8 },
      { date: '2024-01-15', moyenne: 14.5, nombre_notes: 28, mediane: 14.4, ecart_type: 2.5 }
    ];

    return of(mockData).pipe(delay(800));
  }

  private getMockStatistiquesMatieres(): Observable<StatistiqueMatiere[]> {
    const mockData: StatistiqueMatiere[] = [
      {
        matiere_id: 1,
        matiere: 'Mathématiques',
        moyenne: 14.2,
        nb_notes: 198,
        meilleure_note: 19.5,
        note_la_plus_basse: 4.5,
        ecart_type: 3.2,
        coefficient: 4,
        progression: 85,
        objectif_atteint: true
      },
      {
        matiere_id: 2,
        matiere: 'Physique',
        moyenne: 13.1,
        nb_notes: 89,
        meilleure_note: 18.0,
        note_la_plus_basse: 6.0,
        ecart_type: 2.8,
        coefficient: 3,
        progression: 72,
        objectif_atteint: false
      },
      {
        matiere_id: 3,
        matiere: 'Français',
        moyenne: 12.8,
        nb_notes: 60,
        meilleure_note: 17.5,
        note_la_plus_basse: 5.5,
        ecart_type: 3.1,
        coefficient: 3,
        progression: 68,
        objectif_atteint: false
      }
    ];

    return of(mockData).pipe(delay(900));
  }

  private getMockComparaisonPeriodes(): Observable<ComparaisonPeriode> {
    const mockData: ComparaisonPeriode = {
      periode_actuelle: {
        nom: 'Janvier 2024',
        moyenne: 14.2,
        nb_notes: 89,
        date_debut: '2024-01-01',
        date_fin: '2024-01-31'
      },
      periode_precedente: {
        nom: 'Décembre 2023',
        moyenne: 13.6,
        nb_notes: 76,
        date_debut: '2023-12-01',
        date_fin: '2023-12-31'
      },
      evolution: {
        moyenne: 0.6,
        nb_notes: 13,
        pourcentage: 4.4,
        tendance: 'hausse'
      }
    };

    return of(mockData).pipe(delay(1100));
  }

  private getMockStatistiquesEleve(eleveId: number): Observable<StatistiqueEleve> {
    const mockData: StatistiqueEleve = {
      eleve_id: eleveId,
      eleve_nom: 'Dupont',
      eleve_prenom: 'Pierre',
      classe: '6ème A',
      moyenne_generale: 16.5,
      evolution: 2.3,
      nb_notes: 12,
      rang: 1,
      points_forts: ['Mathématiques', 'Logique', 'Résolution de problèmes'],
      points_faibles: ['Expression écrite', 'Participation orale'],
      recommandations: [
        'Encourager la participation en classe',
        'Travail supplémentaire en français',
        'Maintenir l\'excellence en mathématiques'
      ],
      statut: 'excellent'
    };

    return of(mockData).pipe(delay(700));
  }

  private getMockElevesEnDifficulte(): Observable<StatistiqueEleve[]> {
    const mockData: StatistiqueEleve[] = [
      {
        eleve_id: 15,
        eleve_nom: 'Moreau',
        eleve_prenom: 'Julie',
        classe: '5ème B',
        moyenne_generale: 8.2,
        evolution: -1.5,
        nb_notes: 8,
        rang: 25,
        points_forts: ['Arts plastiques'],
        points_faibles: ['Mathématiques', 'Sciences', 'Méthodologie'],
        recommandations: [
          'Soutien scolaire en mathématiques',
          'Aide méthodologique',
          'Suivi personnalisé'
        ],
        statut: 'alerte'
      }
    ];

    return of(mockData).pipe(delay(600));
  }

  private getMockExcellentsEleves(): Observable<StatistiqueEleve[]> {
    const mockData: StatistiqueEleve[] = [
      {
        eleve_id: 1,
        eleve_nom: 'Dupont',
        eleve_prenom: 'Pierre',
        classe: '6ème A',
        moyenne_generale: 16.5,
        evolution: 1.2,
        nb_notes: 12,
        rang: 1,
        points_forts: ['Mathématiques', 'Sciences', 'Logique'],
        points_faibles: [],
        recommandations: [
          'Approfondir les sujets',
          'Projets d\'enrichissement',
          'Mentorat d\'autres élèves'
        ],
        statut: 'excellent'
      }
    ];

    return of(mockData).pipe(delay(650));
  }

  private getMockRapportStatistique(type: string): Observable<RapportStatistique> {
    const mockData: RapportStatistique = {
      id: 'rapport_' + Date.now(),
      titre: `Rapport ${type} - ${new Date().toLocaleDateString()}`,
      type: type as any,
      description: `Rapport détaillé des statistiques de type ${type}`,
      donnees: {},
      graphiques: [
        {
          type: 'bar',
          titre: 'Évolution des moyennes',
          donnees: []
        }
      ],
      date_generation: new Date().toISOString(),
      parametres: {}
    };

    return of(mockData).pipe(delay(2000));
  }
}