// src/app/core/services/note.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { PaginatedResponse } from '../../shared/models/common.model';
import { 
  Note, 
  CreateNoteRequest, 
  UpdateNoteRequest, 
  NoteFilters, 
  BulkNoteResult,
  NoteStatistiques 
} from '../../shared/models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private readonly apiUrl = `${environment.apiUrl}/notes`;
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir toutes les notes avec filtres et pagination
   */
  getNotes(filters?: NoteFilters): Observable<ApiResponse<PaginatedResponse<Note>>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<PaginatedResponse<Note>>>(this.apiUrl, { params });
  }

  /**
   * Obtenir une note par ID
   */
  getNote(id: number): Observable<ApiResponse<Note>> {
    return this.http.get<ApiResponse<Note>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer une nouvelle note
   */
  createNote(note: CreateNoteRequest): Observable<ApiResponse<Note>> {
    return this.http.post<ApiResponse<Note>>(this.apiUrl, note);
  }

  /**
   * Créer plusieurs notes en une seule fois (MÉTHODE MANQUANTE AJOUTÉE)
   */
  createNotesEnLot(notes: CreateNoteRequest[]): Observable<ApiResponse<BulkNoteResult>> {
    return this.http.post<ApiResponse<BulkNoteResult>>(`${this.apiUrl}/batch`, { notes });
  }

  /**
   * Mettre à jour une note
   */
  updateNote(id: number, note: UpdateNoteRequest): Observable<ApiResponse<Note>> {
    return this.http.put<ApiResponse<Note>>(`${this.apiUrl}/${id}`, note);
  }

  /**
   * Supprimer une note
   */
  deleteNote(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Supprimer plusieurs notes
   */
  deleteNotes(ids: number[]): Observable<ApiResponse<BulkNoteResult>> {
    return this.http.request<ApiResponse<BulkNoteResult>>('delete', this.apiUrl, {
      body: { ids }
    });
  }

  /**
   * Obtenir les notes d'un élève
   */
  getNotesByEleve(eleveId: number, filters?: NoteFilters): Observable<ApiResponse<PaginatedResponse<Note>>> {
    const queryFilters = { ...filters, eleve_id: eleveId };
    return this.getNotes(queryFilters);
  }

  /**
   * Obtenir les notes d'une classe
   */
  getNotesByClasse(classeId: number, filters?: NoteFilters): Observable<ApiResponse<PaginatedResponse<Note>>> {
    const queryFilters = { ...filters, classe_id: classeId };
    return this.getNotes(queryFilters);
  }

  /**
   * Obtenir les notes d'une matière
   */
  getNotesByMatiere(matiereId: number, filters?: NoteFilters): Observable<ApiResponse<PaginatedResponse<Note>>> {
    const queryFilters = { ...filters, matiere_id: matiereId };
    return this.getNotes(queryFilters);
  }

  /**
   * Obtenir les notes d'un enseignant
   */
  getNotesByEnseignant(enseignantId: number, filters?: NoteFilters): Observable<ApiResponse<PaginatedResponse<Note>>> {
    const queryFilters = { ...filters, enseignant_id: enseignantId };
    return this.getNotes(queryFilters);
  }

  /**
   * Obtenir les statistiques des notes
   */
  getStatistiques(filters?: NoteFilters): Observable<ApiResponse<NoteStatistiques>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<NoteStatistiques>>(`${this.apiUrl}/statistiques`, { params });
  }

  /**
   * Exporter les notes en CSV
   */
  exportNotes(filters?: NoteFilters): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  /**
   * Obtenir les classes d'un enseignant (NOUVELLE MÉTHODE)
   */
  getClassesEnseignant(enseignantId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/enseignants/${enseignantId}/classes`);
  }

  /**
   * Obtenir les matières d'un enseignant (NOUVELLE MÉTHODE)
   */
  getMatieresEnseignant(enseignantId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/enseignants/${enseignantId}/matieres`);
  }

  /**
   * Obtenir les élèves d'une classe (NOUVELLE MÉTHODE)
   */
  getElevesClasse(classeId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/classes/${classeId}/eleves`);
  }

  /**
   * Valider une note
   */
  validerNote(valeur: number): boolean {
    return valeur >= 0 && valeur <= 20;
  }

  /**
   * Calculer la moyenne d'une liste de notes
   */
  calculerMoyenne(notes: Note[]): number {
    if (!notes || notes.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCoefficients = 0;
    
    notes.forEach(note => {
      const coefficient = note.coefficient || 1;
      totalPoints += note.valeur * coefficient;
      totalCoefficients += coefficient;
    });
    
    return totalCoefficients > 0 ? Math.round((totalPoints / totalCoefficients) * 100) / 100 : 0;
  }

  /**
   * Obtenir la mention d'une note
   */
  getMention(note: number): string {
    if (note >= 16) return 'Excellent';
    if (note >= 14) return 'Très Bien';
    if (note >= 12) return 'Bien';
    if (note >= 10) return 'Assez Bien';
    if (note >= 8) return 'Passable';
    return 'Insuffisant';
  }

  /**
   * Obtenir la couleur de la mention
   */
  getMentionColor(note: number): string {
    if (note >= 16) return 'green';
    if (note >= 14) return 'blue';
    if (note >= 12) return 'yellow';
    if (note >= 10) return 'orange';
    if (note >= 8) return 'red-400';
    return 'red';
  }

  /**
   * Formater une note pour l'affichage
   */
  formatNote(note: number): string {
    return note.toFixed(2).replace('.', ',');
  }

  /**
   * Vérifier si une note est dans la plage valide
   */
  isNoteValide(note: number): boolean {
    return note >= 0 && note <= 20;
  }
}