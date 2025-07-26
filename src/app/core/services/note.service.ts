// src/app/core/services/note.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Note, 
  CreateNoteRequest, 
  UpdateNoteRequest, 
  NoteFilters,
  NoteStatistiques,
  BulkNoteOperation,
  BulkNoteResult
} from '../../shared/models/note.model';
import { ApiResponse } from '../../shared/models/api-response.model';
import { PaginatedResponse } from '../../shared/models/common.model';

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
   * Créer plusieurs notes en lot - MÉTHODE AJOUTÉE
   */
  createNotesEnLot(notes: CreateNoteRequest[]): Observable<ApiResponse<BulkNoteResult>> {
    return this.http.post<ApiResponse<BulkNoteResult>>(`${this.apiUrl}/batch`, { 
      notes: notes 
    });
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
   * Supprimer plusieurs notes
   */
  deleteNotes(noteIds: number[]): Observable<ApiResponse<BulkNoteResult>> {
    return this.http.request<ApiResponse<BulkNoteResult>>('DELETE', this.apiUrl, {
      body: { note_ids: noteIds }
    });
  }

  /**
   * Obtenir les notes par classe
   */
  getNotesByClasse(classeId: number, filters?: NoteFilters): Observable<PaginatedResponse<Note>> {
    const url = `${this.apiUrl}/classe/${classeId}`;
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Note>>(url, { params });
  }

  /**
   * Obtenir les notes par élève
   */
  getNotesByEleve(eleveId: number, filters?: NoteFilters): Observable<PaginatedResponse<Note>> {
    const url = `${this.apiUrl}/eleve/${eleveId}`;
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Note>>(url, { params });
  }

  /**
   * Obtenir les notes par matière
   */
  getNotesByMatiere(matiereId: number, filters?: NoteFilters): Observable<PaginatedResponse<Note>> {
    const url = `${this.apiUrl}/matiere/${matiereId}`;
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Note>>(url, { params });
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
   * Obtenir les moyennes par élève
   */
  getMoyennesEleves(classeId: number, matiereId?: number): Observable<ApiResponse<any[]>> {
    let url = `${this.apiUrl}/moyennes/classe/${classeId}`;
    let params = new HttpParams();
    
    if (matiereId) {
      params = params.set('matiere_id', matiereId.toString());
    }

    return this.http.get<ApiResponse<any[]>>(url, { params });
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
   * Importer des notes depuis un fichier CSV
   */
  importNotes(file: File): Observable<ApiResponse<BulkNoteResult>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<BulkNoteResult>>(`${this.apiUrl}/import`, formData);
  }

  // =====================================
  // MÉTHODES UTILITAIRES
  // =====================================

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
    
    let sommeNotes = 0;
    let sommeCoefficients = 0;
    
    notes.forEach(note => {
      const coefficient = note.coefficient || 1;
      sommeNotes += note.valeur * coefficient;
      sommeCoefficients += coefficient;
    });
    
    return sommeCoefficients > 0 ? Math.round((sommeNotes / sommeCoefficients) * 100) / 100 : 0;
  }

  /**
   * Calculer la moyenne simple
   */
  calculerMoyenneSimple(notes: Note[]): number {
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

  /**
   * Formater une note pour l'affichage
   */
  formatNote(note: number): string {
    return note.toFixed(2).replace('.', ',');
  }

  /**
   * Obtenir le label du type d'évaluation
   */
  getTypeEvaluationLabel(type: string): string {
    const types: { [key: string]: string } = {
      'devoir': 'Devoir',
      'controle': 'Contrôle',
      'examen': 'Examen'
    };
    return types[type] || type;
  }

  /**
   * Obtenir la couleur du type d'évaluation
   */
  getTypeEvaluationColor(type: string): string {
    const colors: { [key: string]: string } = {
      'devoir': 'blue',
      'controle': 'orange',
      'examen': 'red'
    };
    return colors[type] || 'gray';
  }

  /**
   * Vérifier si l'enseignant peut modifier une note
   */
  canEditNote(note: Note, enseignantId: number): boolean {
    return note.enseignant_id === enseignantId;
  }

  /**
   * Vérifier si l'enseignant peut supprimer une note
   */
  canDeleteNote(note: Note, enseignantId: number): boolean {
    return note.enseignant_id === enseignantId;
  }

  /**
   * Grouper les notes par élève
   */
  groupNotesByEleve(notes: Note[]): { [eleveId: number]: Note[] } {
    return notes.reduce((acc, note) => {
      if (!acc[note.eleve_id]) {
        acc[note.eleve_id] = [];
      }
      acc[note.eleve_id].push(note);
      return acc;
    }, {} as { [eleveId: number]: Note[] });
  }

  /**
   * Grouper les notes par matière
   */
  groupNotesByMatiere(notes: Note[]): { [matiereId: number]: Note[] } {
    return notes.reduce((acc, note) => {
      if (!acc[note.matiere_id]) {
        acc[note.matiere_id] = [];
      }
      acc[note.matiere_id].push(note);
      return acc;
    }, {} as { [matiereId: number]: Note[] });
  }
}