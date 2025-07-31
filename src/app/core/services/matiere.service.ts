import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { API_ENDPOINTS, API_PARAMS, EndpointBuilder } from '../constants/api-endpoints';
import { 
  Matiere,
  PaginatedResponse,
  CreateMatiereRequest,
  UpdateMatiereRequest,
  MatiereFilters,
  MatiereStatistiques 
} from '../../shared/models/matiere.model';
import { Enseignant } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class MatiereService {

  constructor(private apiService: ApiService) {}

  /**
   * Récupérer la liste des matières avec filtres et pagination
   */
  getMatieres(filters?: MatiereFilters): Observable<PaginatedResponse<Matiere>> {
    const params = this.buildFilterParams(filters);
    
    // ✅ CORRIGÉ: Utilise API_ENDPOINTS au lieu d'URL en dur
    return this.apiService.get<any>(API_ENDPOINTS.MATIERES.LIST, { params }).pipe(
      map((response: any) => {
        console.log('📚 Réponse API matières:', response);
        
        if (response && response.matieres) {
          return {
            data: response.matieres.data || [],
            meta: {
              current_page: response.matieres.current_page,
              per_page: response.matieres.per_page,
              total: response.matieres.total,
              last_page: response.matieres.last_page,
              from: response.matieres.from,
              to: response.matieres.to
            },
            links: {
              first: response.matieres.first_page_url,
              last: response.matieres.last_page_url,
              prev: response.matieres.prev_page_url,
              next: response.matieres.next_page_url
            }
          };
        }
        
        return this.createEmptyPaginatedResponse();
      }),
      catchError(error => {
        console.error('❌ Erreur récupération matières:', error);
        return of(this.createEmptyPaginatedResponse());
      })
    );
  }

  /**
   * Récupérer une matière par ID
   */
  getMatiereById(id: number): Observable<Matiere> {
    return this.apiService.get<any>(API_ENDPOINTS.MATIERES.BY_ID(id)).pipe(
      map((response: any) => {
        console.log('📖 Matière récupérée:', response);
        
        if (response && response.matiere) {
          return response.matiere as Matiere;
        }
        if (response && response.data) {
          return response.data as Matiere;
        }
        return response as Matiere;
      }),
      catchError(error => {
        console.error('❌ Erreur récupération matière:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Créer une nouvelle matière
   */
  createMatiere(data: CreateMatiereRequest): Observable<Matiere> {
    // Validation des données avant envoi
    const validationErrors = this.validateMatiereData(data);
    if (validationErrors.length > 0) {
      return throwError(() => new Error(validationErrors.join(', ')));
    }

    return this.apiService.post<any>(API_ENDPOINTS.MATIERES.CREATE, data).pipe(
      map((response: any) => {
        console.log('✅ Matière créée:', response);
        
        if (response && response.matiere) {
          return response.matiere as Matiere;
        }
        if (response && response.data) {
          return response.data as Matiere;
        }
        return response as Matiere;
      }),
      catchError(error => {
        console.error('❌ Erreur création matière:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mettre à jour une matière
   */
  updateMatiere(id: number, data: UpdateMatiereRequest): Observable<Matiere> {
    // Validation des données avant envoi
    const validationErrors = this.validateMatiereData(data);
    if (validationErrors.length > 0) {
      return throwError(() => new Error(validationErrors.join(', ')));
    }

    return this.apiService.put<any>(API_ENDPOINTS.MATIERES.UPDATE(id), data).pipe(
      map((response: any) => {
        console.log('✅ Matière mise à jour:', response);
        
        if (response && response.matiere) {
          return response.matiere as Matiere;
        }
        if (response && response.data) {
          return response.data as Matiere;
        }
        return response as Matiere;
      }),
      catchError(error => {
        console.error('❌ Erreur mise à jour matière:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Activer/désactiver une matière
   */
  toggleMatiereStatus(id: number): Observable<Matiere> {
    return this.apiService.patch<any>(API_ENDPOINTS.MATIERES.TOGGLE_STATUS(id), {}).pipe(
      map((response: any) => {
        console.log('🔄 Statut matière basculé:', response);
        
        if (response && response.matiere) {
          return response.matiere as Matiere;
        }
        if (response && response.data) {
          return response.data as Matiere;
        }
        return response as Matiere;
      }),
      catchError(error => {
        console.error('❌ Erreur toggle statut matière:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprimer une matière
   */
  deleteMatiere(id: number): Observable<void> {
    return this.apiService.delete<any>(API_ENDPOINTS.MATIERES.DELETE(id)).pipe(
      map(() => {
        console.log('🗑️ Matière supprimée avec succès');
        return void 0;
      }),
      catchError(error => {
        console.error('❌ Erreur suppression matière:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer les enseignants disponibles pour une matière
   */
  getEnseignantsDisponibles(matiereId: number): Observable<Enseignant[]> {
    return this.apiService.get<any>(API_ENDPOINTS.MATIERES.ENSEIGNANTS_DISPONIBLES(matiereId)).pipe(
      map((response: any) => {
        console.log('👨‍🏫 Enseignants disponibles:', response);
        
        if (Array.isArray(response)) return response as Enseignant[];
        if (response.data && Array.isArray(response.data)) return response.data as Enseignant[];
        if (response.enseignants && Array.isArray(response.enseignants)) return response.enseignants as Enseignant[];
        return [] as Enseignant[];
      }),
      catchError(error => {
        console.error('❌ Erreur récupération enseignants disponibles:', error);
        return of([] as Enseignant[]);
      })
    );
  }

  /**
   * Affecter un enseignant à une matière
   */
  affecterEnseignant(matiereId: number, enseignantId: number): Observable<any> {
    const body = { enseignant_id: enseignantId };
    
    return this.apiService.post<any>(
      API_ENDPOINTS.MATIERES.AFFECTER_ENSEIGNANT(matiereId), 
      body
    ).pipe(
      map((response: any) => {
        console.log('✅ Enseignant affecté à la matière:', response);
        
        if (response && response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error('❌ Erreur affectation enseignant:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Retirer un enseignant d'une matière
   */
  retirerEnseignant(matiereId: number, enseignantId: number): Observable<void> {
    return this.apiService.delete<any>(
      API_ENDPOINTS.MATIERES.RETIRER_ENSEIGNANT(matiereId, enseignantId)
    ).pipe(
      map(() => {
        console.log('🗑️ Enseignant retiré de la matière avec succès');
        return void 0;
      }),
      catchError(error => {
        console.error('❌ Erreur retrait enseignant:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ CORRIGÉ: Récupérer les statistiques des matières (utilise API_ENDPOINTS)
   */
  getMatiereStatistiques(): Observable<MatiereStatistiques> {
    return this.apiService.get<any>(API_ENDPOINTS.MATIERES.STATS).pipe(
      map((response: any) => {
        console.log('📊 Statistiques matières:', response);
        
        if (response && response.data) {
          return response.data as MatiereStatistiques;
        }
        return response as MatiereStatistiques;
      }),
      catchError(error => {
        console.error('❌ Erreur récupération statistiques matières:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ CORRIGÉ: Rechercher des matières (utilise API_ENDPOINTS)
   */
  searchMatieres(query: string): Observable<Matiere[]> {
    const params = { q: query };
    
    return this.apiService.get<any>(API_ENDPOINTS.MATIERES.SEARCH, { params }).pipe(
      map((response: any) => {
        console.log('🔍 Résultats recherche matières:', response);
        
        if (Array.isArray(response)) return response as Matiere[];
        if (response.data && Array.isArray(response.data)) return response.data as Matiere[];
        if (response.matieres && Array.isArray(response.matieres)) return response.matieres as Matiere[];
        return [] as Matiere[];
      }),
      catchError(error => {
        console.error('❌ Erreur recherche matières:', error);
        return of([] as Matiere[]);
      })
    );
  }

  /**
   * ✅ CORRIGÉ: Exporter la liste des matières (utilise API_ENDPOINTS et EndpointBuilder)
   */
  exportMatieres(filters?: MatiereFilters, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const filterParams = this.buildFilterParams(filters);
    const exportParams = { 
      ...filterParams,
      format 
    };
    
    // ✅ CORRIGÉ: Utilise EndpointBuilder pour construire l'URL d'export
    const exportUrl = EndpointBuilder.buildExportUrl(API_ENDPOINTS.MATIERES.EXPORT, format, filterParams);
    
    return this.apiService.get<Blob>(exportUrl, { 
      skipApiResponseWrapper: true,
      headers: { 'Accept': 'application/octet-stream' }
    }).pipe(
      map((blob: Blob) => {
        console.log('📥 Export matières généré:', blob);
        return blob;
      }),
      catchError(error => {
        console.error('❌ Erreur export matières:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ AMÉLIORÉ: Construire les paramètres de filtrage avec meilleur typage
   */
  private buildFilterParams(filters?: MatiereFilters): Record<string, string> {
    if (!filters) return {};

    const params: Record<string, string> = {};

    if (filters.actif !== undefined) {
      params[API_PARAMS.FILTERS.ACTIVE] = filters.actif.toString();
    }
    if (filters.recherche) {
      params[API_PARAMS.FILTERS.SEARCH] = filters.recherche;
    }
    if (filters.page) {
      params[API_PARAMS.PAGINATION.PAGE] = filters.page.toString();
    }
    if (filters.per_page) {
      params[API_PARAMS.PAGINATION.PER_PAGE] = filters.per_page.toString();
    }
    if (filters.sort_by) {
      params[API_PARAMS.PAGINATION.SORT_BY] = filters.sort_by;
    }
    if (filters.sort_direction) {
      params[API_PARAMS.PAGINATION.SORT_DIRECTION] = filters.sort_direction;
    }

    return params;
  }

  /**
   * Créer une réponse paginée vide
   */
  private createEmptyPaginatedResponse(): PaginatedResponse<Matiere> {
    return {
      data: [],
      meta: {
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
        from: null,
        to: null
      },
      links: {
        first: undefined,
        last: undefined,
        prev: null,
        next: null
      }
    };
  }

  /**
   * ✅ AMÉLIORÉ: Valider les données d'une matière avec meilleurs messages
   */
  validateMatiereData(data: CreateMatiereRequest | UpdateMatiereRequest): string[] {
    const errors: string[] = [];

    if ('nom' in data && (!data.nom || data.nom.trim().length < 2)) {
      errors.push('Le nom de la matière doit contenir au moins 2 caractères');
    }

    if ('nom' in data && data.nom && data.nom.trim().length > 100) {
      errors.push('Le nom de la matière ne peut pas dépasser 100 caractères');
    }

    if ('code' in data && (!data.code || data.code.trim().length < 2)) {
      errors.push('Le code de la matière doit contenir au moins 2 caractères');
    }

    if ('code' in data && data.code && data.code.trim().length > 10) {
      errors.push('Le code de la matière ne peut pas dépasser 10 caractères');
    }

    if ('coefficient' in data && data.coefficient !== undefined) {
      if (data.coefficient < 0.5 || data.coefficient > 5.0) {
        errors.push('Le coefficient doit être entre 0.5 et 5.0');
      }
    }

    if ('description' in data && data.description && data.description.length > 500) {
      errors.push('La description ne peut pas dépasser 500 caractères');
    }

    return errors;
  }

  /**
   * Générer un code matière automatique
   */
  generateMatiereCode(nom: string): string {
    if (!nom || nom.trim().length === 0) {
      return 'MAT';
    }

    return nom
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 4)
      .padEnd(3, 'X'); // Assure au moins 3 caractères
  }

  /**
   * Obtenir la couleur selon le coefficient
   */
  getCoefficientColor(coefficient: number): string {
    if (coefficient <= 1) return 'success'; // Vert
    if (coefficient <= 2) return 'info';    // Bleu
    if (coefficient <= 3) return 'warning'; // Orange
    return 'danger'; // Rouge
  }

  /**
   * Formater le coefficient pour l'affichage
   */
  formatCoefficient(coefficient: number): string {
    return coefficient % 1 === 0 ? coefficient.toString() : coefficient.toFixed(1);
  }

  /**
   * Vérifier si une matière peut être supprimée
   */
  canDeleteMatiere(matiere: Matiere): boolean {
    return !matiere.notes_count || matiere.notes_count === 0;
  }

  /**
   * ✅ AMÉLIORÉ: Obtenir la liste des matières communes avec plus de matières
   */
  getMatieresCommunes(): Array<{nom: string, code: string, coefficient: number, description?: string}> {
    return [
      { nom: 'Mathématiques', code: 'MATH', coefficient: 3, description: 'Algèbre, géométrie, analyse' },
      { nom: 'Français', code: 'FR', coefficient: 3, description: 'Littérature, grammaire, expression écrite' },
      { nom: 'Histoire-Géographie', code: 'HG', coefficient: 2, description: 'Histoire et géographie' },
      { nom: 'Sciences Physiques', code: 'SP', coefficient: 2, description: 'Physique et chimie' },
      { nom: 'Sciences de la Vie et de la Terre', code: 'SVT', coefficient: 2, description: 'Biologie et géologie' },
      { nom: 'Anglais', code: 'ANG', coefficient: 2, description: 'Langue vivante 1' },
      { nom: 'Espagnol', code: 'ESP', coefficient: 2, description: 'Langue vivante 2' },
      { nom: 'Allemand', code: 'ALL', coefficient: 2, description: 'Langue vivante 2' },
      { nom: 'Éducation Physique et Sportive', code: 'EPS', coefficient: 1, description: 'Sport et activités physiques' },
      { nom: 'Arts Plastiques', code: 'AP', coefficient: 1, description: 'Dessin, peinture, sculpture' },
      { nom: 'Musique', code: 'MUS', coefficient: 1, description: 'Éducation musicale' },
      { nom: 'Philosophie', code: 'PHILO', coefficient: 3, description: 'Réflexion philosophique' },
      { nom: 'Économie', code: 'ECO', coefficient: 2, description: 'Sciences économiques et sociales' },
      { nom: 'Technologie', code: 'TECH', coefficient: 1, description: 'Informatique et technologie' },
      { nom: 'Latin', code: 'LAT', coefficient: 1, description: 'Langue et culture latines' },
      { nom: 'Grec', code: 'GREC', coefficient: 1, description: 'Langue et culture grecques' }
    ];
  }

  /**
   * Calculer la moyenne pondérée d'une liste de matières
   */
  calculateMoyennePonderee(matieres: Array<{note: number, coefficient: number}>): number {
    if (!matieres || matieres.length === 0) return 0;

    const sommeNotes = matieres.reduce((sum, m) => {
      if (typeof m.note === 'number' && typeof m.coefficient === 'number') {
        return sum + (m.note * m.coefficient);
      }
      return sum;
    }, 0);
    
    const sommeCoefficients = matieres.reduce((sum, m) => {
      if (typeof m.coefficient === 'number') {
        return sum + m.coefficient;
      }
      return sum;
    }, 0);
    
    return sommeCoefficients > 0 ? Math.round((sommeNotes / sommeCoefficients) * 100) / 100 : 0;
  }

  /**
   * Obtenir l'importance d'une matière selon son coefficient
   */
  getImportanceLevel(coefficient: number): string {
    if (coefficient >= 3) return 'Très importante';
    if (coefficient >= 2) return 'Importante';
    if (coefficient >= 1) return 'Normale';
    return 'Secondaire';
  }

  /**
   * ✅ NOUVEAU: Obtenir l'icône d'une matière selon son nom
   */
  getMatiereIcon(nom: string): string {
    const nomLower = nom.toLowerCase();
    
    if (nomLower.includes('math')) return 'calculator';
    if (nomLower.includes('français') || nomLower.includes('francais')) return 'book-open';
    if (nomLower.includes('histoire') || nomLower.includes('géographie')) return 'map';
    if (nomLower.includes('physique') || nomLower.includes('chimie')) return 'flask';
    if (nomLower.includes('biologie') || nomLower.includes('svt')) return 'leaf';
    if (nomLower.includes('anglais') || nomLower.includes('espagnol') || nomLower.includes('allemand')) return 'globe';
    if (nomLower.includes('sport') || nomLower.includes('eps')) return 'activity';
    if (nomLower.includes('art') || nomLower.includes('musique')) return 'palette';
    if (nomLower.includes('philosophie')) return 'brain';
    if (nomLower.includes('économie') || nomLower.includes('eco')) return 'trending-up';
    if (nomLower.includes('technologie') || nomLower.includes('informatique')) return 'monitor';
    
    return 'book'; // Icône par défaut
  }

  /**
   * ✅ NOUVEAU: Vérifier si un code matière est unique
   */
  // checkCodeUnique(code: string, excludeId?: number): Observable<boolean> {
  //   const params = { code, ...(excludeId && { exclude_id: excludeId }) };
    
  //   return this.apiService.get<any>('/admin/matieres/check-code', { params }).pipe(
  //     map((response: any) => {
  //       return response.unique || response.disponible || false;
  //     }),
  //     catchError(() => of(false))
  //   );
  // }

  /**
   * ✅ NOUVEAU: Obtenir les matières populaires (les plus utilisées)
   */
  getMatieresPopulaires(): Observable<Matiere[]> {
    return this.apiService.get<any>('/admin/matieres/populaires').pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response as Matiere[];
        if (response.data && Array.isArray(response.data)) return response.data as Matiere[];
        if (response.matieres && Array.isArray(response.matieres)) return response.matieres as Matiere[];
        return [] as Matiere[];
      }),
      catchError(error => {
        console.error('❌ Erreur récupération matières populaires:', error);
        return of([] as Matiere[]);
      })
    );
  }
}