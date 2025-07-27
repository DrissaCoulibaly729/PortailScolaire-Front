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
   * Fonctions utilitaires
   */
  private calculateTauxReussite(moyennes: MoyenneClasse[]): number {
    if (!moyennes || moyennes.length === 0) return 0;
    const totalEleves = moyennes.reduce((sum, m) => sum + m.effectif, 0);
    const elevesReussis = moyennes.reduce((sum, m) => sum + (m.effectif * m.taux_reussite / 100), 0);
    return totalEleves > 0 ? Math.round((elevesReussis / totalEleves) * 100) : 0;
  }

  private generateChartData(classes: ClasseWithEffectif[], matieres: Matiere[], activity: ActivityItem[]): ChartData {
    // Génération des données pour les graphiques
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
    // Données simulées - à remplacer par de vraies données
    return [
      { mention: 'Excellent', nombre: 15, couleur: '#10B981' },
      { mention: 'Très Bien', nombre: 25, couleur: '#3B82F6' },
      { mention: 'Bien', nombre: 30, couleur: '#F59E0B' },
      { mention: 'Assez Bien', nombre: 20, couleur: '#F97316' },
      { mention: 'Insuffisant', nombre: 10, couleur: '#EF4444' }
    ];
  }

  private generateEvolutionMoyennes(): Array<{ periode: string; moyenne: number }> {
    // Données simulées - à remplacer par de vraies données
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

  // CORRECTION 10 : Interface PaginatedResponse corrigée
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