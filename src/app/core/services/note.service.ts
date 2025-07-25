// src/app/core/services/note.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Note, 
  CreateNoteRequest, 
  UpdateNoteRequest, 
  NoteFilters,
  PaginatedResponse,
  ApiResponse
} from '../../shared/models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = `${environment.apiUrl}/enseignant/notes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir la liste des notes avec filtres
   */
  getNotes(filters?: NoteFilters): Observable<PaginatedResponse<Note>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Note>>(this.apiUrl, { params });
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
  createNote(noteData: CreateNoteRequest): Observable<ApiResponse<Note>> {
    return this.http.post<ApiResponse<Note>>(this.apiUrl, noteData);
  }

  /**
   * Créer plusieurs notes en lot
   */
  createNotesEnLot(notes: CreateNoteRequest[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/batch`, { notes });
  }

  /**
   * Mettre à jour une note
   */
  updateNote(id: number, noteData: UpdateNoteRequest): Observable<ApiResponse<Note>> {
    return this.http.put<ApiResponse<Note>>(`${this.apiUrl}/${id}`, noteData);
  }

  /**
   * Supprimer une note
   */
  deleteNote(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtenir les statistiques des notes
   */
  getStatistiques(filters?: NoteFilters): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/statistiques`, { params });
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
    
    const total = notes.reduce((sum, note) => sum + note.valeur, 0);
    return Math.round((total / notes.length) * 100) / 100;
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
}