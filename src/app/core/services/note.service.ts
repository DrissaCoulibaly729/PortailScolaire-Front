
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { 
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteFilters,
  PaginatedResponse,
  NotesStatistiques,
  BulkNoteOperation
} from '../../shared/models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {

  constructor(private apiService: ApiService) {}

  /**
   * Récupérer la liste des notes avec filtres et pagination
   */
  getNotes(filters?: NoteFilters): Observable<PaginatedResponse<Note>> {
    const params = this.buildFilterParams(filters);
    return this.apiService.get<any>('/admin/notes', { params }).pipe(
      map((response: any) => {
        console.log('📝 Réponse API notes:', response);
        
        if (response && response.notes) {
          return {
            data: response.notes.data || [],
            meta: {
              current_page: response.notes.current_page,
              per_page: response.notes.per_page,
              total: response.notes.total,
              last_page: response.notes.last_page,
              from: response.notes.from,
              to: response.notes.to
            },
            links: {
              first: response.notes.first_page_url,
              last: response.notes.last_page_url,
              prev: response.notes.prev_page_url,
              next: response.notes.next_page_url
            }
          };
        }
        
        return this.createEmptyPaginatedResponse();
      })
    );
  }

  /**
   * Récupérer une note par ID
   */
  getNoteById(id: number): Observable<Note> {
    return this.apiService.get<any>(`/admin/notes/${id}`).pipe(
      map((response: any) => {
        if (response && response.note) {
          return response.note as Note;
        }
        if (response && response.data) {
          return response.data as Note;
        }
        return response as Note;
      })
    );
  }

  /**
   * Créer une nouvelle note
   */
  createNote(data: CreateNoteRequest): Observable<Note> {
    return this.apiService.post<any>('/admin/notes', data).pipe(
      map((response: any) => {
        if (response && response.note) {
          return response.note as Note;
        }
        if (response && response.data) {
          return response.data as Note;
        }
        return response as Note;
      })
    );
  }

  /**
   * Mettre à jour une note
   */
  updateNote(id: number, data: UpdateNoteRequest): Observable<Note> {
    return this.apiService.put<any>(`/admin/notes/${id}`, data).pipe(
      map((response: any) => {
        if (response && response.note) {
          return response.note as Note;
        }
        if (response && response.data) {
          return response.data as Note;
        }
        return response as Note;
      })
    );
  }

  /**
   * Supprimer une note
   */
  deleteNote(id: number): Observable<void> {
    return this.apiService.delete<any>(`/admin/notes/${id}`).pipe(
      map(() => void 0)
    );
  }

  /**
   * Récupérer les notes d'un élève pour une matière
   */
  getNotesEleveMatiere(eleveId: number, matiereId: number, periode?: string): Observable<Note[]> {
    const params: any = { eleve_id: eleveId, matiere_id: matiereId };
    if (periode) params.periode = periode;

    return this.apiService.get<any>('/admin/notes/eleve-matiere', { params }).pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response as Note[];
        if (response.data && Array.isArray(response.data)) return response.data as Note[];
        if (response.notes && Array.isArray(response.notes)) return response.notes as Note[];
        return [] as Note[];
      })
    );
  }

  /**
   * Récupérer les notes d'une classe pour une matière
   */
  getNotesClasseMatiere(classeId: number, matiereId: number, periode?: string): Observable<Note[]> {
    const params: any = { classe_id: classeId, matiere_id: matiereId };
    if (periode) params.periode = periode;

    return this.apiService.get<any>('/admin/notes/classe-matiere', { params }).pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response as Note[];
        if (response.data && Array.isArray(response.data)) return response.data as Note[];
        if (response.notes && Array.isArray(response.notes)) return response.notes as Note[];
        return [] as Note[];
      })
    );
  }

  /**
   * Saisie groupée de notes (pour les enseignants)
   */
  createBulkNotes(notes: CreateNoteRequest[]): Observable<Note[]> {
    return this.apiService.post<any>('/admin/notes/bulk', { notes }).pipe(
      map((response: any) => {
        if (Array.isArray(response)) return response as Note[];
        if (response.data && Array.isArray(response.data)) return response.data as Note[];
        if (response.notes && Array.isArray(response.notes)) return response.notes as Note[];
        return [] as Note[];
      })
    );
  }

  /**
   * Calculer la moyenne d'un élève pour une matière
   */
  calculerMoyenneEleveMatiere(eleveId: number, matiereId: number, periode?: string): Observable<number> {
    const params: any = { eleve_id: eleveId, matiere_id: matiereId };
    if (periode) params.periode = periode;

    return this.apiService.get<any>('/admin/notes/moyenne-eleve-matiere', { params }).pipe(
      map((response: any) => {
        if (response && typeof response.moyenne === 'number') {
          return response.moyenne;
        }
        if (response && response.data && typeof response.data.moyenne === 'number') {
          return response.data.moyenne;
        }
        return 0;
      })
    );
  }

  /**
   * Calculer la moyenne générale d'un élève
   */
  calculerMoyenneGeneraleEleve(eleveId: number, periode?: string): Observable<number> {
    const params: any = { eleve_id: eleveId };
    if (periode) params.periode = periode;

    return this.apiService.get<any>('/admin/notes/moyenne-generale-eleve', { params }).pipe(
      map((response: any) => {
        if (response && typeof response.moyenne === 'number') {
          return response.moyenne;
        }
        if (response && response.data && typeof response.data.moyenne === 'number') {
          return response.data.moyenne;
        }
        return 0;
      })
    );
  }

  /**
   * Récupérer les statistiques des notes
   */
  getNotesStatistiques(filters?: Partial<NoteFilters>): Observable<NotesStatistiques> {
    const params = this.buildFilterParams(filters);
    return this.apiService.get<any>('/admin/notes/statistiques', { params }).pipe(
      map((response: any) => {
        if (response && response.data) {
          return response.data as NotesStatistiques;
        }
        return response as NotesStatistiques;
      })
    );
  }

  /**
   * Exporter les notes
   */
  exportNotes(filters?: NoteFilters, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const params = { 
      ...this.buildFilterParams(filters),
      format 
    };
    return this.apiService.download(`/admin/notes/export?${new URLSearchParams(params).toString()}`);
  }

  /**
   * Construire les paramètres de filtrage
   */
  private buildFilterParams(filters?: Partial<NoteFilters>): any {
    if (!filters) return {};

    const params: any = {};

    if (filters.eleve_id) params.eleve_id = filters.eleve_id.toString();
    if (filters.matiere_id) params.matiere_id = filters.matiere_id.toString();
    if (filters.classe_id) params.classe_id = filters.classe_id.toString();
    if (filters.enseignant_id) params.enseignant_id = filters.enseignant_id.toString();
    if (filters.type) params.type = filters.type;
    if (filters.periode) params.periode = filters.periode;
    if (filters.date_debut) params.date_debut = filters.date_debut;
    if (filters.date_fin) params.date_fin = filters.date_fin;
    if (filters.note_min) params.note_min = filters.note_min.toString();
    if (filters.note_max) params.note_max = filters.note_max.toString();
    if (filters.page) params.page = filters.page.toString();
    if (filters.per_page) params.per_page = filters.per_page.toString();
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_direction) params.sort_direction = filters.sort_direction;

    return params;
  }

  /**
   * Créer une réponse paginée vide
   */
  private createEmptyPaginatedResponse(): PaginatedResponse<Note> {
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
   * Valider une note
   */
  validateNote(valeur: number): boolean {
    return valeur >= 0 && valeur <= 20;
  }

  /**
   * Obtenir la mention d'une note
   */
  getMention(valeur: number): string {
    if (valeur >= 16) return 'Excellent';
    if (valeur >= 14) return 'Très Bien';
    if (valeur >= 12) return 'Bien';
    if (valeur >= 10) return 'Assez Bien';
    if (valeur >= 8) return 'Passable';
    return 'Insuffisant';  
  }

  /**
   * Obtenir la couleur d'une mention
   */
  getMentionColor(valeur: number): string {
    if (valeur >= 16) return 'green';
    if (valeur >= 14) return 'blue';
    if (valeur >= 12) return 'yellow';
    if (valeur >= 10) return 'orange';
    return 'red';
  }

  /**
   * Calculer la moyenne pondérée
   */
  calculerMoyennePonderee(notes: Array<{valeur: number, coefficient: number}>): number {
    if (notes.length === 0) return 0;
    
    const sommeNotes = notes.reduce((sum, note) => sum + (note.valeur * note.coefficient), 0);
    const sommeCoefficients = notes.reduce((sum, note) => sum + note.coefficient, 0);
    
    return sommeCoefficients > 0 ? sommeNotes / sommeCoefficients : 0;
  }

  /**
   * Formater une note pour l'affichage
   */
  formatNote(valeur: number): string {
    return valeur % 1 === 0 ? valeur.toString() : valeur.toFixed(2);
  }

  /**
   * Générer un code couleur pour une note
   */
  getNoteColorClass(valeur: number): string {
    const color = this.getMentionColor(valeur);
    return `text-${color}-600`;
  }

  /**
   * Vérifier si une note peut être modifiée
   */
  canEditNote(note: Note): boolean {
    // Logique métier : par exemple, pas de modification après X jours
    const dateEvaluation = new Date(note.date_evaluation);
    const maintenant = new Date();
    const joursEcoules = Math.floor((maintenant.getTime() - dateEvaluation.getTime()) / (1000 * 3600 * 24));
    
    return joursEcoules <= 30; // Modifiable pendant 30 jours
  }

  /**
   * Obtenir les types de notes disponibles
   */
  getTypesNotes(): Array<{value: string, label: string}> {
    return [
      { value: 'devoir', label: 'Devoir' },
      { value: 'controle', label: 'Contrôle' },
      { value: 'examen', label: 'Examen' }
    ];
  }

  /**
   * Obtenir les périodes disponibles
   */
  getPeriodesDisponibles(): Array<{value: string, label: string}> {
    return [
      { value: 'trimestre1', label: '1er Trimestre' },
      { value: 'trimestre2', label: '2ème Trimestre' },
      { value: 'trimestre3', label: '3ème Trimestre' }
    ];
  }
}