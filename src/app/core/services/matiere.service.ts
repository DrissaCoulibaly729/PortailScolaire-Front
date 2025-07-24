import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
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
      })
    );
  }

  /**
   * Récupérer une matière par ID
   */
  getMatiereById(id: number): Observable<Matiere> {
    return this.apiService.get<any>(API_ENDPOINTS.MATIERES.BY_ID(id)).pipe(
      map((response: any) => {
        if (response && response.matiere) {
          return response.matiere as Matiere;
        }
        if (response && response.data) {
          return response.data as Matiere;
        }
        return response as Matiere;
      })
    );
  }

  /**
   * Créer une nouvelle matière
   */
  createMatiere(data: CreateMatiereRequest): Observable<Matiere> {
    return this.apiService.post<any>(API_ENDPOINTS.MATIERES.CREATE, data).pipe(
      map((response: any) => {
        if (response && response.matiere) {
          return response.matiere as Matiere;
        }
        if (response && response.data) {
          return response.data as Matiere;
        }
        return response as Matiere;
      })
    );
  }

  /**
   * Mettre à jour une matière
   */
  updateMatiere(id: number, data: UpdateMatiereRequest): Observable<Matiere> {
    return this.apiService.put<any>(API_ENDPOINTS.MATIERES.UPDATE(id), data).pipe(
      map((response: any) => {
        if (response && response.matiere) {
          return response.matiere as Matiere;
        }
        if (response && response.data) {
          return response.data as Matiere;
        }
        return response as Matiere;
      })
    );
  }

  /**
   * Activer/désactiver une matière
   */
  toggleMatiereStatus(id: number): Observable<Matiere> {
    return this.apiService.patch<any>(API_ENDPOINTS.MATIERES.TOGGLE_STATUS(id), {}).pipe(
      map((response: any) => {
        if (response && response.matiere) {
          return response.matiere as Matiere;
        }
        if (response && response.data) {
          return response.data as Matiere;
        }
        return response as Matiere;
      })
    );
  }

  /**
   * Supprimer une matière
   */
  deleteMatiere(id: number): Observable<void> {
    return this.apiService.delete<any>(API_ENDPOINTS.MATIERES.DELETE(id)).pipe(
      map(() => void 0)
    );
  }

  /**
   * Récupérer les enseignants disponibles pour une matière
   */
  getEnseignantsDisponibles(matiereId: number): Observable<Enseignant[]> {
    return this.apiService.get<any>(API_ENDPOINTS.MATIERES.ENSEIGNANTS_DISPONIBLES(matiereId)).pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response as Enseignant[];
        if (response.data && Array.isArray(response.data)) return response.data as Enseignant[];
        if (response.enseignants && Array.isArray(response.enseignants)) return response.enseignants as Enseignant[];
        return [] as Enseignant[];
      })
    );
  }

  /**
   * Affecter un enseignant à une matière
   */
  affecterEnseignant(matiereId: number, enseignantId: number): Observable<any> {
    return this.apiService.post<any>(
      API_ENDPOINTS.MATIERES.AFFECTER_ENSEIGNANT(matiereId), 
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
   * Retirer un enseignant d'une matière
   */
  retirerEnseignant(matiereId: number, enseignantId: number): Observable<void> {
    return this.apiService.delete<any>(
      API_ENDPOINTS.MATIERES.RETIRER_ENSEIGNANT(matiereId, enseignantId)
    ).pipe(
      map(() => void 0)
    );
  }

  /**
   * Récupérer les statistiques des matières
   */
  getMatiereStatistiques(): Observable<MatiereStatistiques> {
    return this.apiService.get<any>('/admin/matieres/statistiques').pipe(
      map((response: any) => {
        if (response && response.data) {
          return response.data as MatiereStatistiques;
        }
        return response as MatiereStatistiques;
      })
    );
  }

  /**
   * Rechercher des matières (autocomplete)
   */
  searchMatieres(query: string): Observable<Matiere[]> {
    const params = { q: query };
    return this.apiService.get<any>('/admin/matieres/recherche', { params }).pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response as Matiere[];
        if (response.data && Array.isArray(response.data)) return response.data as Matiere[];
        if (response.matieres && Array.isArray(response.matieres)) return response.matieres as Matiere[];
        return [] as Matiere[];
      })
    );
  }

  /**
   * Exporter la liste des matières
   */
  exportMatieres(filters?: MatiereFilters, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const params = { 
      ...this.buildFilterParams(filters),
      format 
    };
    return this.apiService.download(`/admin/matieres/export?${new URLSearchParams(params).toString()}`);
  }

  /**
   * Construire les paramètres de filtrage
   */
  private buildFilterParams(filters?: MatiereFilters): any {
    if (!filters) return {};

    const params: any = {};

    if (filters.actif !== undefined) params.actif = filters.actif.toString();
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
   * Valider les données d'une matière
   */
  validateMatiereData(data: CreateMatiereRequest | UpdateMatiereRequest): string[] {
    const errors: string[] = [];

    if ('nom' in data && (!data.nom || data.nom.trim().length < 2)) {
      errors.push('Le nom de la matière doit contenir au moins 2 caractères');
    }

    if ('code' in data && (!data.code || data.code.trim().length < 2)) {
      errors.push('Le code de la matière doit contenir au moins 2 caractères');
    }

    if ('coefficient' in data && data.coefficient !== undefined && (data.coefficient < 0.5 || data.coefficient > 5.0)) {
      errors.push('Le coefficient doit être entre 0.5 et 5.0');
    }

    return errors;
  }

  /**
   * Générer un code matière automatique
   */
  generateMatiereCode(nom: string): string {
    return nom
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 4);
  }

  /**
   * Obtenir la couleur selon le coefficient
   */
  getCoefficientColor(coefficient: number): string {
    if (coefficient <= 1) return 'green';
    if (coefficient <= 2) return 'blue';
    if (coefficient <= 3) return 'orange';
    return 'red';
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
   * Obtenir la liste des matières communes
   */
  getMatieresCommunes(): Array<{nom: string, code: string, coefficient: number}> {
    return [
      { nom: 'Mathématiques', code: 'MATH', coefficient: 3 },
      { nom: 'Français', code: 'FR', coefficient: 3 },
      { nom: 'Histoire-Géographie', code: 'HG', coefficient: 2 },
      { nom: 'Sciences Physiques', code: 'SP', coefficient: 2 },
      { nom: 'Sciences de la Vie et de la Terre', code: 'SVT', coefficient: 2 },
      { nom: 'Anglais', code: 'ANG', coefficient: 2 },
      { nom: 'Éducation Physique et Sportive', code: 'EPS', coefficient: 1 },
      { nom: 'Arts Plastiques', code: 'AP', coefficient: 1 },
      { nom: 'Musique', code: 'MUS', coefficient: 1 },
      { nom: 'Philosophie', code: 'PHILO', coefficient: 3 },
      { nom: 'Économie', code: 'ECO', coefficient: 2 }
    ];
  }

  /**
   * Calculer la moyenne pondérée d'une liste de matières
   */
  calculateMoyennePonderee(matieres: Array<{note: number, coefficient: number}>): number {
    const sommeNotes = matieres.reduce((sum, m) => sum + (m.note * m.coefficient), 0);
    const sommeCoefficients = matieres.reduce((sum, m) => sum + m.coefficient, 0);
    
    return sommeCoefficients > 0 ? sommeNotes / sommeCoefficients : 0;
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
}