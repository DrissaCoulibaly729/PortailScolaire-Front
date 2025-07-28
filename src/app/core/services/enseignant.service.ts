// src/app/core/services/enseignant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of, throwError } from 'rxjs';
import { map, tap, catchError, shareReplay, finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
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

  constructor(private http: HttpClient) {}

  /**
   * Charger les données complètes du dashboard enseignant
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

  /**
   * Obtenir les classes d'un enseignant
   */
  getClasses(enseignantId: number, forceRefresh = false): Observable<ClasseWithEffectif[]> {
    const cacheKey = `classes_${enseignantId}`;
    
    if (!forceRefresh && this.isDataCached(cacheKey)) {
      // CORRECTION 3 : Typage explicite
      const cachedData = this.getFromCache<ClasseWithEffectif[]>(cacheKey);
      this.classesSubject.next(cachedData);
      return of(cachedData);
    }

    return this.http.get<ApiResponse<ClasseWithEffectif[]>>(`${this.apiUrl}/${enseignantId}/classes`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors du chargement des classes');
          }
          return response.data || [];
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
   * Obtenir les matières d'un enseignant
   */
  getMatieres(enseignantId: number, forceRefresh = false): Observable<Matiere[]> {
    const cacheKey = `matieres_${enseignantId}`;
    
    if (!forceRefresh && this.isDataCached(cacheKey)) {
      // CORRECTION 4 : Typage explicite
      const cachedData = this.getFromCache<Matiere[]>(cacheKey);
      this.matieresSubject.next(cachedData);
      return of(cachedData);
    }

    return this.http.get<ApiResponse<Matiere[]>>(`${this.apiUrl}/${enseignantId}/matieres`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors du chargement des matières');
          }
          return response.data || [];
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
   * Obtenir les statistiques d'un enseignant
   */
  getStats(enseignantId: number): Observable<EnseignantStats> {
    const cacheKey = `stats_${enseignantId}`;
    
    if (this.isDataCached(cacheKey)) {
      // CORRECTION 5 : Typage explicite
      return of(this.getFromCache<EnseignantStats>(cacheKey));
    }

    return this.http.get<ApiResponse<EnseignantStats>>(`${this.apiUrl}/${enseignantId}/stats`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors du chargement des statistiques');
          }
          return response.data || this.getDefaultStats();
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
   * Obtenir l'activité récente d'un enseignant
   */
  getRecentActivity(enseignantId: number): Observable<ActivityItem[]> {
    const cacheKey = `activity_${enseignantId}`;
    
    if (this.isDataCached(cacheKey)) {
      // CORRECTION 6 : Typage explicite
      return of(this.getFromCache<ActivityItem[]>(cacheKey));
    }

    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${enseignantId}/activity`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors du chargement de l\'activité');
          }
          return this.mapToActivityItems(response.data || []);
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
   * Obtenir les élèves d'une classe
   */
  getElevesClasse(classeId: number): Observable<Eleve[]> {
    const cacheKey = `eleves_classe_${classeId}`;
    
    if (this.isDataCached(cacheKey)) {
      // CORRECTION 7 : Typage explicite
      return of(this.getFromCache<Eleve[]>(cacheKey));
    }

    return this.http.get<ApiResponse<Eleve[]>>(`${this.baseUrl}/classes/${classeId}/eleves`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors du chargement des élèves');
          }
          return response.data || [];
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
   * Obtenir les notes avec filtres
   */
  getNotes(enseignantId: number, filters?: NoteFilters): Observable<PaginatedResponse<Note>> {
    let params = new HttpParams();
    params = params.set('enseignant_id', enseignantId.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<PaginatedResponse<Note>>>(`${this.baseUrl}/notes`, { params })
      .pipe(
        // CORRECTION 8 : Typage explicite du map
        map((response: ApiResponse<PaginatedResponse<Note>>) => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors du chargement des notes');
          }
          return response.data || this.getEmptyPaginatedResponse<Note>();
        }),
        catchError(error => {
          console.error('Erreur notes:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Créer une note
   */
  createNote(note: CreateNoteRequest): Observable<Note> {
    return this.http.post<ApiResponse<Note>>(`${this.baseUrl}/notes`, note)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la création de la note');
          }
          return response.data!;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur création note:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Créer plusieurs notes en lot
   */
  createNotesEnLot(notes: CreateNoteRequest[]): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/notes/batch`, { notes })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la création des notes en lot');
          }
          return response.data;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur création notes en lot:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Mettre à jour une note
   */
  updateNote(id: number, note: Partial<Note>): Observable<Note> {
    return this.http.put<ApiResponse<Note>>(`${this.baseUrl}/notes/${id}`, note)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la mise à jour de la note');
          }
          return response.data!;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur mise à jour note:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprimer une note
   */
  deleteNote(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/notes/${id}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la suppression de la note');
          }
          return response.data || true;
        }),
        tap(() => this.invalidateCache()),
        catchError(error => {
          console.error('Erreur suppression note:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les moyennes par classe et matière
   */
  getMoyennesParClasse(enseignantId: number): Observable<MoyenneClasse[]> {
    const cacheKey = `moyennes_${enseignantId}`;
    
    if (this.isDataCached(cacheKey)) {
      // CORRECTION 9 : Typage explicite
      return of(this.getFromCache<MoyenneClasse[]>(cacheKey));
    }

    return this.http.get<ApiResponse<MoyenneClasse[]>>(`${this.apiUrl}/${enseignantId}/moyennes`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors du chargement des moyennes');
          }
          return response.data || [];
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
  // 🆕 NOUVELLES MÉTHODES D'ADMINISTRATION (AJOUTÉES)
  // ============================================

  /**
   * Récupérer tous les enseignants avec filtres (pour l'admin)
   */
getEnseignants(filters?: EnseignantFilters): Observable<EnseignantDetails[]> {
  let params = new HttpParams();
  params = params.set('role', 'enseignant');
  
  if (filters) {
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });
  }

  return this.http.get<any>(`${this.baseUrl}/admin/utilisateurs`, { params })
    .pipe(
      map(response => {
        // ✅ CORRECTION: Votre API renvoie "statut" au lieu de "success"
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors du chargement des enseignants');
        }
        // ✅ CORRECTION: Votre API renvoie "utilisateurs.data" au lieu de "data"
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
   * Récupérer les détails complets d'un enseignant (pour l'admin)
   */
 getEnseignantDetails(id: number): Observable<EnseignantDetails> {
  return this.http.get<any>(`${this.baseUrl}/admin/utilisateurs/${id}`)
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors du chargement des détails');
        }
        // ✅ Supposer que pour un utilisateur unique, c'est dans "utilisateur" ou "data"
        const userData = response.utilisateur || response.data || response;
        return this.enrichEnseignantData(userData);
      }),
      catchError(error => {
        console.error('Erreur détails enseignant:', error);
        return throwError(() => error);
      })
    );
}

creerEnseignant(enseignantData: CreateEnseignantRequest): Observable<EnseignantDetails> {
  const userData = {
    ...enseignantData,
    role: 'enseignant'
  };

  return this.http.post<any>(`${this.baseUrl}/admin/utilisateurs`, userData)
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors de la création de l\'enseignant');
        }
        return response.utilisateur || response.data || response;
      }),
      tap(() => this.invalidateCache()),
      catchError(error => {
        console.error('Erreur création enseignant:', error);
        return throwError(() => error);
      })
    );
}

modifierEnseignant(id: number, enseignantData: Partial<CreateEnseignantRequest>): Observable<EnseignantDetails> {
  return this.http.put<any>(`${this.baseUrl}/admin/utilisateurs/${id}`, enseignantData)
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors de la modification de l\'enseignant');
        }
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
   * Récupérer les matières disponibles pour assignation
   */
getMatieresDisponibles(): Observable<Matiere[]> {
  return this.http.get<any>(`${this.baseUrl}/admin/matieres`)
    .pipe(
      map(response => {
        // ✅ CORRECTION: Votre API renvoie "matieres.data"
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors du chargement des matières disponibles');
        }
        return response.matieres?.data || response.matieres || response.data || [];
      }),
      catchError(error => {
        console.error('Erreur matières disponibles:', error);
        return of([]);
      })
    );
}

  /**
   * Récupérer les classes disponibles pour assignation
   */
getClassesDisponibles(): Observable<ClasseWithEffectif[]> {
  return this.http.get<any>(`${this.baseUrl}/admin/classes`)
    .pipe(
      map(response => {
        // ✅ CORRECTION: Votre API renvoie "classes.data"
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors du chargement des classes disponibles');
        }
        // ✅ Adapter les classes pour inclure effectif_actuel comme effectif
        const classes = response.classes?.data || response.classes || response.data || [];
        return classes.map((classe: any) => ({
          ...classe,
          effectif: classe.eleves_count || classe.effectif_actuel || 0,
          actif: classe.active // ✅ Mapper 'active' vers 'actif' si nécessaire
        }));
      }),
      catchError(error => {
        console.error('Erreur classes disponibles:', error);
        return of([]);
      })
    );
}

searchEnseignants(query: string): Observable<EnseignantDetails[]> {
  const params = new HttpParams()
    .set('search', query)
    .set('role', 'enseignant')
    .set('per_page', '10');

  return this.http.get<any>(`${this.baseUrl}/admin/utilisateurs/search`, { params })
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors de la recherche');
        }
        return response.utilisateurs?.data || response.utilisateurs || response.data || [];
      }),
      catchError(error => {
        console.error('Erreur recherche enseignants:', error);
        return of([]);
      })
    );
}

  /**
   * Activer/Désactiver un enseignant
   */
 toggleEnseignantStatus(id: number): Observable<EnseignantDetails> {
  return this.http.patch<any>(`${this.baseUrl}/admin/utilisateurs/${id}/toggle-statut`, {})
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors du changement de statut');
        }
        return response.utilisateur || response.data || response;
      }),
      tap(() => this.invalidateCache()),
      catchError(error => {
        console.error('Erreur toggle statut enseignant:', error);
        return throwError(() => error);
      })
    );
}

getEnseignantMatieres(enseignantId: number): Observable<Matiere[]> {
  return this.http.get<any>(`${this.baseUrl}/admin/enseignants/${enseignantId}/matieres`)
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors du chargement des matières');
        }
        return response.matieres?.data || response.matieres || response.data || [];
      }),
      catchError(error => {
        console.error('Erreur matières enseignant:', error);
        return of([]);
      })
    );
}

getEnseignantClasses(enseignantId: number): Observable<ClasseWithEffectif[]> {
  return this.http.get<any>(`${this.baseUrl}/admin/enseignants/${enseignantId}/classes`)
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors du chargement des classes');
        }
        return response.classes?.data || response.classes || response.data || [];
      }),
      catchError(error => {
        console.error('Erreur classes enseignant:', error);
        return of([]);
      })
    );
}

assignerMatiere(enseignantId: number, matiereId: number): Observable<void> {
  return this.http.post<any>(`${this.baseUrl}/admin/enseignants/${enseignantId}/matieres`, {
    matiere_id: matiereId
  }).pipe(
    map(response => {
      // ✅ CORRECTION: Adapter à votre structure d'API
      if (response.statut !== 'succes') {
        throw new Error(response.message || 'Erreur lors de l\'assignation de la matière');
      }
      return;
    }),
    tap(() => this.invalidateCache()),
    catchError(error => {
      console.error('Erreur assignation matière:', error);
      return throwError(() => error);
    })
  );
}

retirerClasse(enseignantId: number, classeId: number): Observable<void> {
  return this.http.delete<any>(`${this.baseUrl}/admin/enseignants/${enseignantId}/classes/${classeId}`)
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors du retrait de la classe');
        }
        return;
      }),
      tap(() => this.invalidateCache()),
      catchError(error => {
        console.error('Erreur retrait classe:', error);
        return throwError(() => error);
      })
    );
}

assignerClasse(enseignantId: number, classeId: number): Observable<void> {
  return this.http.post<any>(`${this.baseUrl}/admin/enseignants/${enseignantId}/classes`, {
    classe_id: classeId
  }).pipe(
    map(response => {
      // ✅ CORRECTION: Adapter à votre structure d'API
      if (response.statut !== 'succes') {
        throw new Error(response.message || 'Erreur lors de l\'assignation de la classe');
      }
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
   * Réinitialiser le mot de passe d'un enseignant
   */
resetEnseignantPassword(enseignantId: number): Observable<{ nouveau_mot_de_passe: string }> {
  return this.http.patch<any>(`${this.baseUrl}/admin/utilisateurs/${enseignantId}/reset-password`, {})
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors de la réinitialisation du mot de passe');
        }
        return response.data || response;
      }),
      catchError(error => {
        console.error('Erreur reset password:', error);
        return throwError(() => error);
      })
    );
}

getStatistiquesGlobalesEnseignants(): Observable<{
  total_enseignants: number;
  enseignants_actifs: number;
  moyenne_notes_par_enseignant: number;
  total_matieres_couvertes: number;
  total_classes_gerees: number;
  taux_occupation: number;
}> {
  return this.http.get<any>(`${this.baseUrl}/admin/enseignants/statistiques`)
    .pipe(
      map(response => {
        // ✅ CORRECTION: Adapter à votre structure d'API
        if (response.statut !== 'succes') {
          throw new Error(response.message || 'Erreur lors du chargement des statistiques');
        }
        return response.statistiques || response.data || {
          total_enseignants: 0,
          enseignants_actifs: 0,
          moyenne_notes_par_enseignant: 0,
          total_matieres_couvertes: 0,
          total_classes_gerees: 0,
          taux_occupation: 0
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
    let params = new HttpParams()
      .set('role', 'enseignant')
      .set('format', format);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.baseUrl}/admin/utilisateurs/export`, {
      params,
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
    let params = new HttpParams();
    
    if (options) {
      if (options.periode) params = params.set('periode', options.periode);
      if (options.format) params = params.set('format', options.format);
      if (options.inclure_notes) params = params.set('inclure_notes', '1');
      if (options.inclure_statistiques) params = params.set('inclure_statistiques', '1');
    }

    return this.http.get(`${this.baseUrl}/admin/enseignants/${enseignantId}/rapport`, {
      params,
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