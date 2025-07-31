// src/app/core/services/enseignant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of, throwError } from 'rxjs';
import { map, tap, catchError, shareReplay, finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiService } from './api.service'; // ✅ AJOUT
import { API_ENDPOINTS } from '../constants/api-endpoints'; // ✅ AJOUT
import { ApiResponse } from '../../shared/models/api-response.model';
import { PaginatedResponse } from '../../shared/models/common.model';
import { Enseignant, Eleve } from '../../shared/models/user.model';
import { Classe } from '../../shared/models/classe.model';
import { Matiere } from '../../shared/models/matiere.model';
import { Note, NoteFilters, CreateNoteRequest, UpdateNoteRequest } from '../../shared/models/note.model';

export interface EnseignantDashboardData {
  stats: {
    totalClasses: number;
    totalMatieres: number;
    totalEleves: number;
    notesSaisies: number;
    moyenneGenerale: number;
    tauxReussite: number;
  };
  classes: Classe[];
  matieres: Matiere[];
  recentActivity: ActivityItem[];
  moyennesParClasse: MoyenneClasse[];
  chartData: ChartData;
}

export interface RecentActivity {
  dernieres_notes: ActivityItem[];
  derniere_connexion: string;
}

export interface ActivityItem {
  id: string;
  type: 'note_added' | 'note_updated' | 'note_deleted' | 'bulletin_generated' | 'classe_updated';
  message: string;
  timestamp: Date;
  metadata?: {
    eleve?: string;
    classe?: string;
    matiere?: string;
    note?: number;
  };
}

export interface EnseignantDetails extends Enseignant {
  matieres?: Matiere[];
  classes?: ClasseWithEffectif[];
  statistiques?: EnseignantStats;
}

export interface MoyenneClasse {
  classe_id: number;
  classe_nom: string;
  moyenne: number;
  effectif: number;
  taux_reussite: number;
}

export interface ChartData {
  notesParMois: Array<{ mois: string; nombre: number }>;
  distributionMentions: Array<{ mention: string; nombre: number; couleur: string }>;
  evolutionMoyennes: Array<{ periode: string; moyenne: number }>;
}

export interface EnseignantStats {
  notes_saisies: number;
  moyenne_generale: number;
  total_eleves: number;
  classes_actives: number;
  matieres_enseignees: number;
}

// CORRECTION : Extension de Classe pour ajouter la propriété effectif
export interface ClasseWithEffectif extends Classe {
  effectif?: number;
}

// ============================================
// 🆕 NOUVELLES INTERFACES POUR L'ADMIN (AJOUTÉES)
// ============================================

export interface EnseignantFilters {
  recherche?: string;
  matiere_id?: number;
  classe_id?: number;
  actif?: boolean;
  specialite?: string;
  date_embauche_min?: string;
  date_embauche_max?: string;
}

export interface CreateEnseignantRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  date_naissance?: string;
  adresse?: string;
  specialite?: string;
  matieres_ids?: number[];
  classes_ids?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class EnseignantService {
  private readonly apiUrl = `${environment.apiUrl}/enseignants`;
  private readonly baseUrl = environment.apiUrl;
  
  // Cache des données courantes avec BehaviorSubjects
  private dashboardDataSubject = new BehaviorSubject<EnseignantDashboardData | null>(null);
  private classesSubject = new BehaviorSubject<ClasseWithEffectif[]>([]);
  private matieresSubject = new BehaviorSubject<Matiere[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Observables publics
  public dashboardData$ = this.dashboardDataSubject.asObservable();
  public classes$ = this.classesSubject.asObservable();
  public matieres$ = this.matieresSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Cache pour optimiser les performances
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private apiService: ApiService // ✅ AJOUT
  ) {}

  /**
   * ✅ CORRIGÉ - Charger les données complètes du dashboard enseignant
   */
  loadDashboardData(enseignantId: number, forceRefresh = false): Observable<EnseignantDashboardData> {
    const cacheKey = `dashboard_${enseignantId}`;
    
    if (!forceRefresh && this.isDataCached(cacheKey)) {
      // CORRECTION 1 : Typage explicite du cache
      const cachedData = this.getFromCache<EnseignantDashboardData>(cacheKey);
      this.dashboardDataSubject.next(cachedData);
      return of(cachedData);
    }

    this.setLoading(true);
    this.clearError();

    return combineLatest([
      this.getClasses(enseignantId),
      this.getMatieres(enseignantId),
      this.getStats(enseignantId),
      this.getRecentActivity(enseignantId),
      this.getMoyennesParClasse(enseignantId)
    ]).pipe(
      map(([classes, matieres, stats, activity, moyennes]) => {
        const dashboardData: EnseignantDashboardData = {
          stats: {
            totalClasses: classes.length,
            totalMatieres: matieres.length,
            // CORRECTION 2 : Gestion safe de la propriété effectif
            totalEleves: classes.reduce((total, classe) => total + (this.getEffectif(classe)), 0),
            notesSaisies: stats.notes_saisies || 0,
            moyenneGenerale: stats.moyenne_generale || 0,
            tauxReussite: this.calculateTauxReussite(moyennes)
          },
          classes,
          matieres,
          recentActivity: activity,
          moyennesParClasse: moyennes,
          chartData: this.generateChartData(classes, matieres, activity)
        };
        
        // Mettre à jour les caches
        this.dashboardDataSubject.next(dashboardData);
        this.classesSubject.next(classes);
        this.matieresSubject.next(matieres);
        this.setToCache(cacheKey, dashboardData);
        
        return dashboardData;
      }),
      catchError(error => {
        this.setError('Erreur lors du chargement des données du dashboard');
        console.error('Erreur dashboard:', error);
        return throwError(() => error);
      }),
      finalize(() => this.setLoading(false)),
      shareReplay(1)
    );
  }

  // Ajout à votre EnseignantService existant - Nouvelle méthode getDashboardData


getDashboardData(): Observable<any> {
  return this.apiService.get<any>(API_ENDPOINTS.ENSEIGNANT.DASHBOARD).pipe(
    tap(response => {
      console.log('📊 Réponse Dashboard API:', response);
    }),
    catchError(error => {
      console.error('❌ Erreur récupération dashboard:', error);
      return of(this.getDefaultDashboardResponse());
    }),
    shareReplay(1)
  );
}

/**
 * ✅ AJOUT : Données par défaut en cas d'erreur
 */
private getDefaultDashboardResponse(): any {
  return {
    message: 'Dashboard par défaut',
    statut: 'succes',
    dashboard: {
      mes_classes: [],
      mes_matieres: [],
      mes_statistiques: {
        total_notes_saisies: 0,
        notes_aujourd_hui: 0,
        notes_cette_semaine: 0,
        total_eleves: 0,
        nombre_classes: 0,
        nombre_matieres: 0,
        moyennes_par_type_evaluation: []
      },
      activite_recente: {
        dernieres_notes: [],
        derniere_connexion: new Date().toLocaleString('fr-FR')
      },
      planning: {
        mes_enseignements: [],
        total_heures_estimees: 0
      }
    }
  };
}
  /**
   * ✅ CORRIGÉ - Obtenir les classes d'un enseignant (utilise API_ENDPOINTS)
   */
  getClasses(enseignantId: number, forceRefresh = false): Observable<ClasseWithEffectif[]> {
    const cacheKey = `classes_${enseignantId}`;
    
    if (!forceRefresh && this.isDataCached(cacheKey)) {
      // CORRECTION 3 : Typage explicite
      const cachedData = this.getFromCache<ClasseWithEffectif[]>(cacheKey);
      this.classesSubject.next(cachedData);
      return of(cachedData);
    }

    // ✅ CORRIGÉ : Utilise le vrai endpoint dashboard enseignant
    return this.apiService.get<any>(API_ENDPOINTS.ENSEIGNANT.DASHBOARD)
      .pipe(
        map(response => {
          console.log('🏫 Classes enseignant:', response);
          // Adapter selon votre format de réponse Laravel
          const classes = response.classes || response.data?.classes || [];
          return classes.map((classe: any) => ({
            ...classe,
            effectif: classe.eleves_count || classe.effectif_actuel || classe.effectif || 0
          })) as ClasseWithEffectif[];
        }),
        tap(classes => {
          this.classesSubject.next(classes);
          this.setToCache(cacheKey, classes);
        }),
        catchError(error => {
          this.setError('Impossible de charger vos classes');
          console.error('Erreur classes:', error);
          return of([]); // Retourner un tableau vide en cas d'erreur
        }),
        shareReplay(1)
      );
  }

  /**
   * ✅ CORRIGÉ - Obtenir les matières d'un enseignant (utilise API_ENDPOINTS)
   */
  getMatieres(enseignantId: number, forceRefresh = false): Observable<Matiere[]> {
    const cacheKey = `matieres_${enseignantId}`;
    
    if (!forceRefresh && this.isDataCached(cacheKey)) {
      // CORRECTION 4 : Typage explicite
      const cachedData = this.getFromCache<Matiere[]>(cacheKey);
      this.matieresSubject.next(cachedData);
      return of(cachedData);
    }

    // ✅ CORRIGÉ : Utilise mes-classes-matieres endpoint
    return this.apiService.get<any>(API_ENDPOINTS.ENSEIGNANT.NOTES.MES_CLASSES_MATIERES)
      .pipe(
        map(response => {
          console.log('📚 Matières enseignant:', response);
          // Adapter selon votre format de réponse Laravel
          return response.matieres || response.data?.matieres || [];
        }),
        tap(matieres => {
          this.matieresSubject.next(matieres);
          this.setToCache(cacheKey, matieres);
        }),
        catchError(error => {
          this.setError('Impossible de charger vos matières');
          console.error('Erreur matières:', error);
          return of([]); // Retourner un tableau vide en cas d'erreur
        }),
        shareReplay(1)
      );
  }

  /**
   * ✅ CORRIGÉ - Obtenir les statistiques d'un enseignant (utilise API_ENDPOINTS)
   */
  getStats(enseignantId: number): Observable<EnseignantStats> {
  const cacheKey = `stats_${enseignantId}`;
  
  if (this.isDataCached(cacheKey)) {
    return of(this.getFromCache<EnseignantStats>(cacheKey));
  }

  return this.getDashboardData().pipe(
    map(response => {
      console.log('📊 Stats depuis dashboard:', response);
      
      // Adapter les données de l'API vers le format EnseignantStats
      const dashboard = response.dashboard;
      const stats = dashboard.mes_statistiques;
      
      const enseignantStats: EnseignantStats = {
        notes_saisies: stats.total_notes_saisies || 0,
        moyenne_generale: 0, // À calculer depuis les matières si nécessaire
        total_eleves: stats.total_eleves || 0,
        classes_actives: stats.nombre_classes || 0,
        matieres_enseignees: stats.nombre_matieres || 0
      };
      
      return enseignantStats;
    }),
    tap(stats => this.setToCache(cacheKey, stats)),
    catchError(error => {
      console.error('Erreur stats:', error);
      return of(this.getDefaultStats());
    }),
    shareReplay(1)
  );
}

  /**
   * ✅ CORRIGÉ - Obtenir l'activité récente d'un enseignant (utilise API_ENDPOINTS)
   */
  getRecentActivity(enseignantId: number): Observable<ActivityItem[]> {
    const cacheKey = `activity_${enseignantId}`;
    
    if (this.isDataCached(cacheKey)) {
      // CORRECTION 6 : Typage explicite
      return of(this.getFromCache<ActivityItem[]>(cacheKey));
    }

    // ✅ CORRIGÉ : Utilise le dashboard endpoint
    return this.apiService.get<any>(API_ENDPOINTS.ENSEIGNANT.DASHBOARD)
      .pipe(
        map(response => {
          console.log('🔄 Activité enseignant:', response);
          // Adapter selon votre format de réponse Laravel
          const rawActivity = response.activite_recente || response.recentActivity || [];
          return this.mapToActivityItems(rawActivity);
        }),
        tap(activity => this.setToCache(cacheKey, activity)),
        catchError(error => {
          console.error('Erreur activité:', error);
          return of(this.getMockActivity());
        }),
        shareReplay(1)
      );
  }

  /**
   * ✅ CORRIGÉ - Obtenir les élèves d'une classe (utilise API_ENDPOINTS)
   */
  getElevesClasse(classeId: number): Observable<Eleve[]> {
    const cacheKey = `eleves_classe_${classeId}`;
    
    if (this.isDataCached(cacheKey)) {
      // CORRECTION 7 : Typage explicite
      return of(this.getFromCache<Eleve[]>(cacheKey));
    }

    // ✅ CORRIGÉ : Utilise l'endpoint admin classes
    return this.apiService.get<any>(API_ENDPOINTS.CLASSES.BY_ID(classeId))
      .pipe(
        map(response => {
          console.log('👨‍🎓 Élèves classe:', response);
          // Adapter selon votre format de réponse Laravel
          return response.eleves || response.classe?.eleves || response.data?.eleves || [];
        }),
        tap(eleves => this.setToCache(cacheKey, eleves)),
        catchError(error => {
          console.error('Erreur élèves:', error);
          return throwError(() => error);
        }),
        shareReplay(1)
      );
  }

  /**
   * ✅ CORRIGÉ - Obtenir les notes avec filtres (utilise API_ENDPOINTS)
   */
  getNotes(enseignantId: number, filters?: NoteFilters): Observable<PaginatedResponse<Note>> {
    let params = new URLSearchParams();
    params.set('enseignant_id', enseignantId.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params.set(key, value.toString());
        }
      });
    }

    const endpoint = params.toString() 
      ? `${API_ENDPOINTS.ENSEIGNANT.NOTES.LIST}?${params.toString()}`
      : API_ENDPOINTS.ENSEIGNANT.NOTES.LIST;

    return this.apiService.get<any>(endpoint)
      .pipe(
        // CORRECTION 8 : Typage explicite du map
        map((response: any) => {
          console.log('📝 Notes enseignant:', response);
          // Adapter selon votre format de réponse Laravel
          if (response.notes) {
            return {
              data: response.notes.data || [],
              meta: response.notes.meta || this.getEmptyPaginatedResponse<Note>().meta,
              links: response.notes.links || this.getEmptyPaginatedResponse<Note>().links
            } as PaginatedResponse<Note>;
          }
          return this.getEmptyPaginatedResponse<Note>();
        }),
        catchError(error => {
          console.error('Erreur notes:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Créer une note (utilise API_ENDPOINTS)
   */
  createNote(note: CreateNoteRequest): Observable<Note> {
    return this.apiService.post<any>(API_ENDPOINTS.ENSEIGNANT.NOTES.SAISIR, note)
      .pipe(
        map(response => {
          console.log('✅ Note créée:', response);
          // Adapter selon votre format de réponse Laravel
          return response.note || response.data || response;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur création note:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Créer plusieurs notes en lot (utilise API_ENDPOINTS)
   */
  createNotesEnLot(notes: CreateNoteRequest[]): Observable<any> {
    return this.apiService.post<any>(API_ENDPOINTS.ENSEIGNANT.NOTES.SAISIE_RAPIDE, { notes })
      .pipe(
        map(response => {
          console.log('⚡ Notes en lot créées:', response);
          // Adapter selon votre format de réponse Laravel
          return response.data || response;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur création notes en lot:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Mettre à jour une note (utilise API_ENDPOINTS)
   */
  updateNote(id: number, note: Partial<Note>): Observable<Note> {
    return this.apiService.put<any>(API_ENDPOINTS.ENSEIGNANT.NOTES.MODIFIER(id), note)
      .pipe(
        map(response => {
          console.log('✏️ Note modifiée:', response);
          // Adapter selon votre format de réponse Laravel
          return response.note || response.data || response;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur mise à jour note:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Supprimer une note (utilise API_ENDPOINTS)
   */
  deleteNote(id: number): Observable<boolean> {
    return this.apiService.delete<any>(API_ENDPOINTS.ENSEIGNANT.NOTES.SUPPRIMER(id))
      .pipe(
        map(response => {
          console.log('🗑️ Note supprimée:', response);
          return true;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur suppression note:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Obtenir les moyennes par classe et matière (utilise API_ENDPOINTS)
   */
  getMoyennesParClasse(enseignantId: number): Observable<MoyenneClasse[]> {
    const cacheKey = `moyennes_${enseignantId}`;
    
    if (this.isDataCached(cacheKey)) {
      // CORRECTION 9 : Typage explicite
      return of(this.getFromCache<MoyenneClasse[]>(cacheKey));
    }

    // ✅ CORRIGÉ : Utilise le dashboard endpoint
    return this.apiService.get<any>(API_ENDPOINTS.ENSEIGNANT.DASHBOARD)
      .pipe(
        map(response => {
          console.log('📈 Moyennes par classe:', response);
          // Adapter selon votre format de réponse Laravel
          return response.moyennes_par_classe || response.moyennesParClasse || [];
        }),
        tap(moyennes => this.setToCache(cacheKey, moyennes)),
        catchError(error => {
          console.error('Erreur moyennes:', error);
          return of([]);
        }),
        shareReplay(1)
      );
  }

  // ============================================
  // ✅ CORRIGÉ - NOUVELLES MÉTHODES D'ADMINISTRATION (utilisent API_ENDPOINTS)
  // ============================================

  /**
   * ✅ CORRIGÉ - Récupérer tous les enseignants avec filtres (pour l'admin)
   */
  getEnseignants(filters?: EnseignantFilters): Observable<EnseignantDetails[]> {
    let params = new URLSearchParams();
    params.set('role', 'enseignant');
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params.set(key, value.toString());
        }
      });
    }

    const endpoint = params.toString() 
      ? `${API_ENDPOINTS.ADMIN.USERS}?${params.toString()}`
      : `${API_ENDPOINTS.ADMIN.USERS}?role=enseignant`;

    return this.apiService.get<any>(endpoint)
      .pipe(
        map(response => {
          console.log('👨‍🏫 Enseignants admin:', response);
          // ✅ CORRECTION: Votre API renvoie "utilisateurs.data"
          const allUsers = response.utilisateurs?.data || [];
          return allUsers.filter((user: any) => user.role === 'enseignant') as EnseignantDetails[];
        }),
        catchError(error => {
          console.error('Erreur récupération enseignants:', error);
          return throwError(() => error);
        })
      );
  }
/**
 * ✅ NOUVELLE MÉTHODE : Récupérer les détails d'une classe avec ses élèves
 */
// Ajoutez cette méthode dans votre EnseignantService


getClasseDetails(classeId: number): Observable<any> {
  const cacheKey = `classe_details_${classeId}`;
  
  if (this.isDataCached && this.isDataCached(cacheKey)) {
    return of(this.getFromCache<any>(cacheKey));
  }

  // Combiner les appels pour récupérer classe + élèves + stats
  return combineLatest([
    this.getDashboardData(), // Pour récupérer les classes de l'enseignant
    this.apiService.get<any>(API_ENDPOINTS.CLASSES.BY_ID(classeId)) // Pour les détails de la classe spécifique
  ]).pipe(
    map(([dashboardResponse, classeResponse]) => {
      console.log('📊 Dashboard pour classe:', dashboardResponse);
      console.log('🏫 Détails classe:', classeResponse);
      
      // Récupérer les données du dashboard
      const dashboard = dashboardResponse.dashboard;
      const mesClasses = dashboard.mes_classes || [];
      const mesStatistiques = dashboard.mes_statistiques || {};
      
      // Trouver la classe dans les données du dashboard
      const classeFromDashboard = mesClasses.find((c: any) => c.id === classeId);
      
      // Récupérer les détails de la classe depuis l'API spécifique
      const classeDetails = classeResponse.classe || classeResponse.data || classeResponse;
      const eleves = classeDetails.eleves || [];
      
      // Calculer les statistiques de la classe
      const effectifActuel = eleves.length;
      const moyennes = eleves
        .map((e: any) => e.moyenne_generale || 0)
        .filter((m: number) => m > 0);
      
      const moyenneClasse = moyennes.length > 0 
        ? moyennes.reduce((sum: number, m: number) => sum + m, 0) / moyennes.length 
        : 0;
      
      const tauxReussite = moyennes.length > 0 
        ? (moyennes.filter((m: number) => m >= 10).length / moyennes.length) * 100 
        : 0;

      // Construire la réponse
      const response = {
        classe: {
          id: classeDetails.id || classeId,
          nom: classeDetails.nom || classeFromDashboard?.nom || 'Classe inconnue',
          niveau: classeDetails.niveau || classeFromDashboard?.niveau || '',
          section: classeDetails.section || classeFromDashboard?.section || '',
          description: classeDetails.description || '',
          effectif_max: classeDetails.effectif_max || classeFromDashboard?.effectif_max || 30,
          effectif_actuel: effectifActuel,
          active: classeDetails.active !== undefined ? classeDetails.active : true,
          created_at: classeDetails.created_at || new Date().toISOString(),
          updated_at: classeDetails.updated_at || new Date().toISOString(),
          // Élèves de la classe
          eleves: eleves.map((eleve: any) => ({
            id: eleve.id,
            nom: eleve.nom || '',
            prenom: eleve.prenom || '',
            email: eleve.email || '',
            numero_etudiant: eleve.numero_etudiant || eleve.numero_inscription || '',
            moyenne_generale: eleve.moyenne_generale || 0,
            rang_classe: eleve.rang_classe || 0,
            created_at: eleve.created_at || new Date().toISOString(),
            updated_at: eleve.updated_at || new Date().toISOString()
          }))
        },
        statistiques: {
          effectif_actuel: effectifActuel,
          effectif_max: classeDetails.effectif_max || classeFromDashboard?.effectif_max || 30,
          moyenne_classe: moyenneClasse,
          taux_reussite: tauxReussite,
          taux_occupation: classeDetails.effectif_max 
            ? Math.round((effectifActuel / classeDetails.effectif_max) * 100) 
            : 0,
          total_notes: mesStatistiques.total_notes_saisies || 0,
          notes_aujourd_hui: mesStatistiques.notes_aujourd_hui || 0,
          notes_cette_semaine: mesStatistiques.notes_cette_semaine || 0
        },
        enseignements: dashboard.planning?.mes_enseignements?.filter((ens: any) => 
          ens.classe === (classeDetails.nom || classeFromDashboard?.nom)
        ) || []
      };

      return response;
    }),
    tap(response => {
      console.log('✅ Classe details assembled:', response);
      if (this.setToCache) {
        this.setToCache(cacheKey, response);
      }
    }),
    catchError(error => {
      console.error('❌ Erreur récupération détails classe:', error);
      return throwError(() => error);
    }),
    shareReplay(1)
  );
}

// Ajoutez cette méthode dans votre EnseignantService

/**
 * ✅ NOUVELLE MÉTHODE : Récupérer les détails d'une matière avec ses classes et statistiques
 */
getMatiereDetails(matiereId: number): Observable<any> {
  const cacheKey = `matiere_details_${matiereId}`;
  
  if (this.isDataCached && this.isDataCached(cacheKey)) {
    return of(this.getFromCache<any>(cacheKey));
  }

  // Combiner les appels pour récupérer matière + classes + stats
  return combineLatest([
    this.getDashboardData(), // Pour récupérer les matières de l'enseignant
    this.apiService.get<any>(API_ENDPOINTS.MATIERES.BY_ID(matiereId)) // Pour les détails de la matière spécifique
  ]).pipe(
    map(([dashboardResponse, matiereResponse]) => {
      console.log('📊 Dashboard pour matière:', dashboardResponse);
      console.log('📚 Détails matière:', matiereResponse);
      
      // Récupérer les données du dashboard
      const dashboard = dashboardResponse.dashboard;
      const mesMatieres = dashboard.mes_matieres || [];
      const mesClasses = dashboard.mes_classes || [];
      const mesStatistiques = dashboard.mes_statistiques || {};
      const mesEnseignements = dashboard.planning?.mes_enseignements || [];
      
      // Trouver la matière dans les données du dashboard
      const matiereFromDashboard = mesMatieres.find((m: any) => m.id === matiereId);
      
      if (!matiereFromDashboard) {
        throw new Error('Matière non trouvée dans votre liste d\'enseignement');
      }
      
      // Récupérer les détails de la matière depuis l'API spécifique
      const matiereDetails = matiereResponse.matiere || matiereResponse.data || matiereResponse;
      
      // Trouver les classes qui enseignent cette matière
      const classesEnseignees = mesEnseignements
        .filter((ens: any) => ens.code_matiere === matiereFromDashboard.code || ens.matiere === matiereFromDashboard.nom)
        .map((ens: any) => {
          // Trouver la classe correspondante dans mes_classes
          const classeData = mesClasses.find((c: any) => c.nom === ens.classe);
          return {
            id: classeData?.id || Math.random() * 1000, // Fallback pour l'ID
            nom: ens.classe,
            niveau: classeData?.niveau || '',
            section: classeData?.section || '',
            effectif_actuel: ens.effectif_classe || classeData?.effectif_actuel || 0,
            effectif_max: classeData?.effectif_max || 30,
            actif: classeData?.active !== false,
            moyenne: 0, // À calculer depuis les notes si nécessaire
            created_at: classeData?.created_at || new Date().toISOString(),
            updated_at: classeData?.updated_at || new Date().toISOString()
          };
        });

      // Calculer les statistiques de la matière
      const totalEleves = classesEnseignees.reduce((total: number, classe: any) => total + (classe.effectif_actuel || 0), 0);
      
      // Construire la réponse
      const response = {
        matiere: {
          id: matiereDetails.id || matiereId,
          nom: matiereDetails.nom || matiereFromDashboard.nom || 'Matière inconnue',
          code: matiereDetails.code || matiereFromDashboard.code || '',
          coefficient: matiereDetails.coefficient || matiereFromDashboard.coefficient || '1.0',
          description: matiereDetails.description || '',
          active: matiereDetails.active !== undefined ? matiereDetails.active : true,
          created_at: matiereDetails.created_at || new Date().toISOString(),
          updated_at: matiereDetails.updated_at || new Date().toISOString(),
          // Données spécifiques à l'enseignant
          nombre_notes_saisies: matiereFromDashboard.nombre_notes_saisies || 0,
          moyenne_generale: matiereFromDashboard.moyenne_generale || 0
        },
        classes: classesEnseignees,
        statistiques: {
          total_eleves: totalEleves,
          nombre_classes: classesEnseignees.length,
          notes_saisies: matiereFromDashboard.nombre_notes_saisies || 0,
          moyenne_generale: matiereFromDashboard.moyenne_generale || 0,
          total_notes_etablissement: mesStatistiques.total_notes_saisies || 0,
          notes_aujourd_hui: mesStatistiques.notes_aujourd_hui || 0,
          notes_cette_semaine: mesStatistiques.notes_cette_semaine || 0
        },
        enseignements: mesEnseignements.filter((ens: any) => 
          ens.code_matiere === matiereFromDashboard.code || ens.matiere === matiereFromDashboard.nom
        )
      };

      return response;
    }),
    tap(response => {
      console.log('✅ Matiere details assembled:', response);
      if (this.setToCache) {
        this.setToCache(cacheKey, response);
      }
    }),
    catchError(error => {
      console.error('❌ Erreur récupération détails matière:', error);
      return throwError(() => error);
    }),
    shareReplay(1)
  );
}
  /**
   * ✅ CORRIGÉ - Récupérer les détails complets d'un enseignant (pour l'admin)
   */
  getEnseignantDetails(id: number): Observable<EnseignantDetails> {
    return this.apiService.get<any>(API_ENDPOINTS.ADMIN.USER_BY_ID(id))
      .pipe(
        map(response => {
          console.log('👤 Détails enseignant:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          const userData = response.utilisateur || response.data || response;
          return this.enrichEnseignantData(userData);
        }),
        catchError(error => {
          console.error('Erreur détails enseignant:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Créer un enseignant (utilise API_ENDPOINTS)
   */
  creerEnseignant(enseignantData: CreateEnseignantRequest): Observable<EnseignantDetails> {
    const userData = {
      ...enseignantData,
      role: 'enseignant'
    };

    return this.apiService.post<any>(API_ENDPOINTS.ADMIN.CREATE_ENSEIGNANT, userData)
      .pipe(
        map(response => {
          console.log('✅ Enseignant créé:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          return response.enseignant || response.utilisateur || response.data || response;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur création enseignant:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Modifier un enseignant (utilise API_ENDPOINTS)
   */
  modifierEnseignant(id: number, enseignantData: Partial<CreateEnseignantRequest>): Observable<EnseignantDetails> {
    return this.apiService.put<any>(API_ENDPOINTS.ADMIN.UPDATE_USER(id), enseignantData)
      .pipe(
        map(response => {
          console.log('✏️ Enseignant modifié:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          return response.utilisateur || response.data || response;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur modification enseignant:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Récupérer les matières disponibles pour assignation (utilise API_ENDPOINTS)
   */
  getMatieresDisponibles(): Observable<Matiere[]> {
    return this.apiService.get<any>(API_ENDPOINTS.MATIERES.LIST)
      .pipe(
        map(response => {
          console.log('📚 Matières disponibles:', response);
          // ✅ CORRECTION: Votre API renvoie "matieres.data"
          return response.matieres?.data || response.matieres || response.data || [];
        }),
        catchError(error => {
          console.error('Erreur matières disponibles:', error);
          return of([]);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Récupérer les classes disponibles pour assignation (utilise API_ENDPOINTS)
   */
  getClassesDisponibles(): Observable<ClasseWithEffectif[]> {
    return this.apiService.get<any>(API_ENDPOINTS.CLASSES.LIST)
      .pipe(
        map(response => {
          console.log('🏫 Classes disponibles:', response);
          // ✅ CORRECTION: Votre API renvoie "classes.data"
          const classes = response.classes?.data || response.classes || response.data || [];
          // ✅ Adapter les classes pour inclure effectif_actuel comme effectif
          return classes.map((classe: any) => ({
            ...classe,
            effectif: classe.eleves_count || classe.effectif_actuel || 0
          }));
        }),
        catchError(error => {
          console.error('Erreur classes disponibles:', error);
          return of([]);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Rechercher des enseignants (utilise API_ENDPOINTS)
   */
  searchEnseignants(query: string): Observable<EnseignantDetails[]> {
    const params = new URLSearchParams();
    params.set('recherche', query);
    params.set('role', 'enseignant');
    params.set('per_page', '10');

    const endpoint = `${API_ENDPOINTS.ADMIN.USERS}?${params.toString()}`;

    return this.apiService.get<any>(endpoint)
      .pipe(
        map(response => {
          console.log('🔍 Recherche enseignants:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          return response.utilisateurs?.data || response.utilisateurs || response.data || [];
        }),
        catchError(error => {
          console.error('Erreur recherche enseignants:', error);
          return of([]);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Activer/Désactiver un enseignant (utilise API_ENDPOINTS)
   */
  toggleEnseignantStatus(id: number): Observable<EnseignantDetails> {
    return this.apiService.patch<any>(API_ENDPOINTS.ADMIN.TOGGLE_USER_STATUS(id), {})
      .pipe(
        map(response => {
          console.log('🔄 Status enseignant toggleé:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          return response.utilisateur || response.data || response;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur toggle statut enseignant:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Récupérer les matières d'un enseignant (utilise API_ENDPOINTS)
   */
  getEnseignantMatieres(enseignantId: number): Observable<Matiere[]> {
    return this.apiService.get<any>(API_ENDPOINTS.ADMIN.USER_BY_ID(enseignantId))
      .pipe(
        map(response => {
          console.log('📚 Matières de l\'enseignant:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          const userData = response.utilisateur || response.data || response;
          return userData.matieres || [];
        }),
        catchError(error => {
          console.error('Erreur matières enseignant:', error);
          return of([]);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Récupérer les classes d'un enseignant (utilise API_ENDPOINTS)
   */
  getEnseignantClasses(enseignantId: number): Observable<ClasseWithEffectif[]> {
    return this.apiService.get<any>(API_ENDPOINTS.ADMIN.USER_BY_ID(enseignantId))
      .pipe(
        map(response => {
          console.log('🏫 Classes de l\'enseignant:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          const userData = response.utilisateur || response.data || response;
          return userData.classes || [];
        }),
        catchError(error => {
          console.error('Erreur classes enseignant:', error);
          return of([]);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Assigner une matière à un enseignant (utilise API_ENDPOINTS)
   */
  assignerMatiere(enseignantId: number, matiereId: number): Observable<void> {
    return this.apiService.post<any>(API_ENDPOINTS.MATIERES.AFFECTER_ENSEIGNANT(matiereId), {
      enseignant_id: enseignantId
    }).pipe(
      map(response => {
        console.log('✅ Matière assignée:', response);
        // ✅ CORRECTION: Adapter à votre structure d'API
        return;
      }),
      tap(() => this.invalidateCache()),
      catchError(error => {
        console.error('Erreur assignation matière:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ CORRIGÉ - Retirer une classe d'un enseignant (utilise API_ENDPOINTS)
   */
  retirerClasse(enseignantId: number, classeId: number): Observable<void> {
    return this.apiService.delete<any>(API_ENDPOINTS.CLASSES.RETIRER_ENSEIGNANT(classeId, enseignantId))
      .pipe(
        map(response => {
          console.log('🗑️ Classe retirée:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          return;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur retrait classe:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Assigner une classe à un enseignant (utilise API_ENDPOINTS)
   */
  assignerClasse(enseignantId: number, classeId: number): Observable<void> {
    return this.apiService.post<any>(API_ENDPOINTS.CLASSES.AFFECTER_ENSEIGNANT(classeId), {
      enseignant_id: enseignantId
    }).pipe(
      map(response => {
        console.log('✅ Classe assignée:', response);
        // ✅ CORRECTION: Adapter à votre structure d'API
        return;
      }),
      tap(() => this.invalidateCache()),
      catchError(error => {
        console.error('Erreur assignation classe:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ CORRIGÉ - Réinitialiser le mot de passe d'un enseignant (utilise API_ENDPOINTS)
   */
  resetEnseignantPassword(enseignantId: number): Observable<{ nouveau_mot_de_passe: string }> {
    return this.apiService.patch<any>(API_ENDPOINTS.ADMIN.RESET_PASSWORD(enseignantId), {})
      .pipe(
        map(response => {
          console.log('🔑 Password reset:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          return {
            nouveau_mot_de_passe: response.nouveau_mot_de_passe || response.data?.nouveau_mot_de_passe || 'Mot de passe réinitialisé'
          };
        }),
        catchError(error => {
          console.error('Erreur reset password:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRIGÉ - Obtenir les statistiques globales des enseignants (à implémenter côté backend)
   */
  getStatistiquesGlobalesEnseignants(): Observable<{
    total_enseignants: number;
    enseignants_actifs: number;
    moyenne_notes_par_enseignant: number;
    total_matieres_couvertes: number;
    total_classes_gerees: number;
    taux_occupation: number;
  }> {
    // ✅ NOTE: Cet endpoint n'existe pas encore dans votre backend, utilise le dashboard admin
    return this.apiService.get<any>(API_ENDPOINTS.ADMIN.DASHBOARD)
      .pipe(
        map(response => {
          console.log('📊 Statistiques globales enseignants:', response);
          // ✅ CORRECTION: Adapter à votre structure d'API
          const stats = response.tableau_bord || response;
          return {
            total_enseignants: stats.utilisateurs?.enseignants || 0,
            enseignants_actifs: stats.utilisateurs?.actifs || 0,
            moyenne_notes_par_enseignant: stats.academique?.nb_notes_total / stats.utilisateurs?.enseignants || 0,
            total_matieres_couvertes: stats.matieres?.total || 0,
            total_classes_gerees: stats.classes?.total || 0,
            taux_occupation: stats.classes?.taux_occupation || 0
          };
        }),
        catchError(error => {
          console.error('Erreur statistiques globales:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Exporter la liste des enseignants
   */
  exporterEnseignants(filters?: EnseignantFilters, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    let params = new URLSearchParams();
    params.set('role', 'enseignant');
    params.set('format', format);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params.set(key, value.toString());
        }
      });
    }

    // ✅ NOTE: Endpoint d'export à créer côté backend
    return this.http.get(`${this.baseUrl}/admin/utilisateurs/export?${params.toString()}`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Erreur export enseignants:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Générer un rapport pour un enseignant
   */
  genererRapportEnseignant(enseignantId: number, options?: {
    periode?: string;
    format?: 'pdf' | 'excel';
    inclure_notes?: boolean;
    inclure_statistiques?: boolean;
  }): Observable<Blob> {
    let params = new URLSearchParams();
    
    if (options) {
      if (options.periode) params.set('periode', options.periode);
      if (options.format) params.set('format', options.format);
      if (options.inclure_notes) params.set('inclure_notes', '1');
      if (options.inclure_statistiques) params.set('inclure_statistiques', '1');
    }

    // ✅ NOTE: Endpoint de rapport à créer côté backend
    return this.http.get(`${this.baseUrl}/admin/enseignants/${enseignantId}/rapport?${params.toString()}`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Erreur génération rapport:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Rafraîchir les données
   */
  refreshData(enseignantId: number): void {
    this.invalidateCache();
    this.loadDashboardData(enseignantId, true).subscribe();
  }

  /**
   * Nettoyer le cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    this.dashboardDataSubject.next(null);
    this.classesSubject.next([]);
    this.matieresSubject.next([]);
  }

  /**
   * Invalider le cache (après modifications)
   */
  private invalidateCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Gestion du cache avec expiration
   */
  private isDataCached(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  private getFromCache<T>(key: string): T {
    return this.cache.get(key) as T;
  }

  private setToCache<T>(key: string, data: T): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Gestion des états
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * NOUVELLE MÉTHODE : Récupérer l'effectif de manière safe
   */
  private getEffectif(classe: ClasseWithEffectif): number {
    return (classe as any).effectif || classe.effectif || 0;
  }

  /**
   * Enrichir les données d'un enseignant avec ses relations
   */
  private enrichEnseignantData(enseignant: any): EnseignantDetails {
    return {
      ...enseignant,
      matieres: enseignant.matieres || [],
      classes: enseignant.classes || [],
      statistiques: enseignant.statistiques || this.getDefaultStats()
    } as EnseignantDetails;
  }

  /**
   * Fonctions utilitaires
   */
  private calculateTauxReussite(moyennes: MoyenneClasse[]): number {
    if (!moyennes || moyennes.length === 0) return 0;
    const totalEleves = moyennes.reduce((sum, m) => sum + m.effectif, 0);
    const elevesReussis = moyennes.reduce((sum, m) => sum + (m.effectif * m.taux_reussite / 100), 0);
    return totalEleves > 0 ? Math.round((elevesReussis / totalEleves) * 100) : 0;
  }

  private generateChartData(classes: ClasseWithEffectif[], matieres: Matiere[], activity: ActivityItem[]): ChartData {
    return {
      notesParMois: this.generateNotesParMois(activity),
      distributionMentions: this.generateDistributionMentions(),
      evolutionMoyennes: this.generateEvolutionMoyennes()
    };
  }

  private generateNotesParMois(activity: ActivityItem[]): Array<{ mois: string; nombre: number }> {
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const notesParMois = new Array(12).fill(0);
    
    activity.forEach(item => {
      if (item.type === 'note_added') {
        const moisIndex = item.timestamp.getMonth();
        notesParMois[moisIndex]++;
      }
    });

    return mois.map((mois, index) => ({
      mois,
      nombre: notesParMois[index]
    }));
  }

  private generateDistributionMentions(): Array<{ mention: string; nombre: number; couleur: string }> {
    return [
      { mention: 'Excellent', nombre: 15, couleur: '#10B981' },
      { mention: 'Très Bien', nombre: 25, couleur: '#3B82F6' },
      { mention: 'Bien', nombre: 30, couleur: '#F59E0B' },
      { mention: 'Assez Bien', nombre: 20, couleur: '#F97316' },
      { mention: 'Insuffisant', nombre: 10, couleur: '#EF4444' }
    ];
  }

  private generateEvolutionMoyennes(): Array<{ periode: string; moyenne: number }> {
    return [
      { periode: '1er Trimestre', moyenne: 13.2 },
      { periode: '2ème Trimestre', moyenne: 13.8 },
      { periode: '3ème Trimestre', moyenne: 14.1 }
    ];
  }

  private mapToActivityItems(rawData: any[]): ActivityItem[] {
    return rawData.map(item => ({
      id: item.id || Math.random().toString(36),
      type: item.type || 'note_added',
      message: item.message || 'Activité inconnue',
      timestamp: new Date(item.timestamp || Date.now()),
      metadata: item.metadata || {}
    }));
  }

  private getMockActivity(): ActivityItem[] {
    return [
      {
        id: '1',
        type: 'note_added',
        message: 'Note ajoutée pour Pierre Durand (6ème A)',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        metadata: { eleve: 'Pierre Durand', classe: '6ème A', note: 15 }
      },
      {
        id: '2',
        type: 'note_updated',
        message: 'Note modifiée pour Sophie Martin (5ème B)',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        metadata: { eleve: 'Sophie Martin', classe: '5ème B', note: 17 }
      }
    ];
  }

  private getDefaultStats(): EnseignantStats {
    return {
      notes_saisies: 0,
      moyenne_generale: 0,
      total_eleves: 0,
      classes_actives: 0,
      matieres_enseignees: 0
    };
  }

  private getEmptyPaginatedResponse<T>(): PaginatedResponse<T> {
    return {
      data: [],
      meta: {
        per_page: 20,
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0,
        total: 0
      },
      links: {
        first: '',
        last: '',
        prev: null,
        next: null
      }
    } as PaginatedResponse<T>;
  }
}