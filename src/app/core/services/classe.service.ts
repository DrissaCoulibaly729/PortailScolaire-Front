import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { 
  Classe, 
  ClasseStatistiques,
  PaginatedResponse,
  CreateClasseRequest,
  UpdateClasseRequest,
  ClasseFilters 
} from '../../shared/models/classe.model';
import { Enseignant } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ClasseService {

  constructor(private apiService: ApiService) {}

  /**
   * Récupérer la liste des classes avec filtres et pagination
   */
  getClasses(filters?: ClasseFilters): Observable<PaginatedResponse<Classe>> {
    const params = this.buildFilterParams(filters);
    return this.apiService.get<any>(API_ENDPOINTS.CLASSES.LIST, { params }).pipe(
      map((response: any) => {
        console.log('🏫 Réponse API classes:', response);
        
        if (response && response.classes) {
          return {
            data: response.classes.data || [],
            meta: {
              current_page: response.classes.current_page,
              per_page: response.classes.per_page,
              total: response.classes.total,
              last_page: response.classes.last_page,
              from: response.classes.from,
              to: response.classes.to
            },
            links: {
              first: response.classes.first_page_url,
              last: response.classes.last_page_url,
              prev: response.classes.prev_page_url,
              next: response.classes.next_page_url
            }
          };
        }
        
        return this.createEmptyPaginatedResponse();
      })
    );
  }

  /**
   * Récupérer une classe par ID
   */
  getClasseById(id: number): Observable<Classe> {
    return this.apiService.get<any>(API_ENDPOINTS.CLASSES.BY_ID(id)).pipe(
      map((response: any) => {
        if (response && response.classe) {
          return response.classe as Classe;
        }
        if (response && response.data) {
          return response.data as Classe;
        }
        return response as Classe;
      })
    );
  }

  /**
   * Créer une nouvelle classe
   */
  createClasse(data: CreateClasseRequest): Observable<Classe> {
    return this.apiService.post<any>(API_ENDPOINTS.CLASSES.CREATE, data).pipe(
      map((response: any) => {
        if (response && response.classe) {
          return response.classe as Classe;
        }
        if (response && response.data) {
          return response.data as Classe;
        }
        return response as Classe;
      })
    );
  }

  /**
   * Mettre à jour une classe
   */
  updateClasse(id: number, data: UpdateClasseRequest): Observable<Classe> {
    return this.apiService.put<any>(API_ENDPOINTS.CLASSES.UPDATE(id), data).pipe(
      map((response: any) => {
        if (response && response.classe) {
          return response.classe as Classe;
        }
        if (response && response.data) {
          return response.data as Classe;
        }
        return response as Classe;
      })
    );
  }

  /**
   * Activer/désactiver une classe
   */
  toggleClasseStatus(id: number): Observable<Classe> {
    return this.apiService.patch<any>(API_ENDPOINTS.CLASSES.TOGGLE_STATUS(id), {}).pipe(
      map((response: any) => {
        if (response && response.classe) {
          return response.classe as Classe;
        }
        if (response && response.data) {
          return response.data as Classe;
        }
        return response as Classe;
      })
    );
  }

  /**
   * Supprimer une classe
   */
  deleteClasse(id: number): Observable<void> {
    return this.apiService.delete<any>(API_ENDPOINTS.CLASSES.DELETE(id)).pipe(
      map(() => void 0)
    );
  }

  /**
   * Affecter un enseignant à une classe
   */
  affecterEnseignant(classeId: number, enseignantId: number): Observable<any> {
    return this.apiService.post<any>(
      API_ENDPOINTS.CLASSES.AFFECTER_ENSEIGNANT(classeId), 
      { enseignant_id: enseignantId }
    ).pipe(
      map((response: any) => {
        if (response && response.data) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Retirer un enseignant d'une classe
   */
  retirerEnseignant(classeId: number, enseignantId: number): Observable<void> {
    return this.apiService.delete<any>(
      API_ENDPOINTS.CLASSES.RETIRER_ENSEIGNANT(classeId, enseignantId)
    ).pipe(
      map(() => void 0)
    );
  }

  /**
   * Récupérer les statistiques des classes
   */
  getClasseStatistiques(): Observable<ClasseStatistiques> {
    return this.apiService.get<any>(API_ENDPOINTS.CLASSES.STATS).pipe(
      map((response: any) => {
        if (response && response.data) {
          return response.data as ClasseStatistiques;
        }
        return response as ClasseStatistiques;
      })
    );
  }

  /**
   * Rechercher des classes (autocomplete)
   */
  searchClasses(query: string): Observable<Classe[]> {
    const params = { q: query };
    return this.apiService.get<any>('/admin/classes/recherche', { params }).pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response as Classe[];
        if (response.data && Array.isArray(response.data)) return response.data as Classe[];
        if (response.classes && Array.isArray(response.classes)) return response.classes as Classe[];
        return [] as Classe[];
      })
    );
  }

  /**
   * Exporter la liste des classes
   */
  exportClasses(filters?: ClasseFilters, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const params = { 
      ...this.buildFilterParams(filters),
      format 
    };
    return this.apiService.download(`/admin/classes/export?${new URLSearchParams(params).toString()}`);
  }

  /**
   * Construire les paramètres de filtrage
   */
  private buildFilterParams(filters?: ClasseFilters): any {
    if (!filters) return {};

    const params: any = {};

    if (filters.niveau) params.niveau = filters.niveau;
    if (filters.active !== undefined) params.active = filters.active.toString();
    if (filters.recherche) params.recherche = filters.recherche;
    if (filters.page) params.page = filters.page.toString();
    if (filters.per_page) params.per_page = filters.per_page.toString();
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_direction) params.sort_direction = filters.sort_direction;

    return params;
  }

  /**
   * Créer une réponse paginée vide
   */
  private createEmptyPaginatedResponse(): PaginatedResponse<Classe> {
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
   * Valider les données d'une classe
   */
  validateClasseData(data: CreateClasseRequest | UpdateClasseRequest): string[] {
    const errors: string[] = [];

    if ('nom' in data && (!data.nom || data.nom.trim().length < 2)) {
      errors.push('Le nom de la classe doit contenir au moins 2 caractères');
    }

    if ('effectif_max' in data && data.effectif_max !== undefined && (data.effectif_max < 1 || data.effectif_max > 100)) {
      errors.push('L\'effectif maximum doit être entre 1 et 100');
    }

    return errors;
  }

  /**
   * Formater le nom complet d'une classe
   */
  getFullName(classe: Classe): string {
    return `${classe.nom} (${classe.niveau})`;
  }

  /**
   * Obtenir le taux d'occupation d'une classe
   */
  getTauxOccupation(classe: Classe): number {
  if (!classe.effectif_actuel || classe.effectif_max === 0) {
    return 0;
  }
  return Math.round((classe.effectif_actuel / classe.effectif_max) * 100);
}

  /**
   * Vérifier si une classe est pleine
   */
  isClassePleine(classe: Classe): boolean {
  if (!classe.effectif_actuel) {
    return false;
  }
  return classe.effectif_actuel >= classe.effectif_max;
}

  /**
   * Obtenir la couleur du statut d'occupation
   */
  getOccupationColor(classe: Classe): string {
    const taux = this.getTauxOccupation(classe);
    
    if (taux < 50) return 'green';
    if (taux < 80) return 'yellow';
    if (taux < 95) return 'orange';
    return 'red';
  }

  /**
   * Générer un nom de classe automatique
   */
  generateClasseName(niveau: string, section: string): string {
    return `${niveau} ${section}`;
  }

  /**
   * Obtenir les niveaux disponibles
   */
  getNiveauxDisponibles(): string[] {
    return ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];
  }

  /**
   * Obtenir les sections disponibles
   */
  getSectionsDisponibles(): string[] {
    return ['A', 'B', 'C', 'D', 'E'];
  }
}