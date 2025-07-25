// src/app/shared/models/note.model.ts
import { Matiere } from "./matiere.model";
import { Eleve, Enseignant } from "./user.model";

// ===== TYPES DE BASE =====
export type TypeEvaluation = 'devoir' | 'controle' | 'examen';
export type TypePeriode = 'trimestre1' | 'trimestre2' | 'trimestre3';

// ===== INTERFACE PRINCIPALE =====
export interface Note {
  id: number;
  eleve_id: number;
  matiere_id: number;
  enseignant_id: number;
  classe_id: number;
  valeur: number;
  type: TypeEvaluation;
  type_evaluation?: TypeEvaluation; // Alias pour la compatibilité
  periode: TypePeriode;
  coefficient?: number; // Ajouté la propriété manquante
  date_evaluation: string;
  commentaire?: string;
  eleve?: Eleve;
  matiere?: Matiere;
  enseignant?: Enseignant;
  created_at: string;
  updated_at: string;
}

// ===== INTERFACES POUR LES REQUÊTES =====
export interface CreateNoteRequest {
  eleve_id: number;
  matiere_id: number;
  classe_id: number;
  valeur: number;
  type: TypeEvaluation;
  periode: TypePeriode;
  date_evaluation: string;
  coefficient?: number;
  commentaire?: string;
}

export interface UpdateNoteRequest {
  valeur?: number;
  type?: TypeEvaluation;
  date_evaluation?: string;
  coefficient?: number;
  commentaire?: string;
}

// ===== INTERFACES POUR LES FILTRES =====
export interface NoteFilters {
  eleve_id?: number;
  matiere_id?: number;
  classe_id?: number;
  enseignant_id?: number;
  type?: string;
  periode?: string;
  date_debut?: string;
  date_fin?: string;
  note_min?: number;
  note_max?: number;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// ===== INTERFACE POUR LA PAGINATION =====
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
}

// ===== INTERFACE POUR LA RÉPONSE API =====
export interface ApiResponse<T> {
  message: string;
  statut: 'succes' | 'erreur';
  data: T;
  erreurs?: { [key: string]: string[] };
}

// ===== INTERFACES POUR LES OPÉRATIONS GROUPÉES =====
export interface BulkNoteOperation {
  operation: 'create' | 'update' | 'delete';
  notes: Array<CreateNoteRequest | (UpdateNoteRequest & { id: number })>;
}

export interface BulkNoteResult {
  success: number;
  errors: number;
  details?: Array<{
    note: any;
    error?: string;
    success?: boolean;
  }>;
}

// ===== INTERFACES POUR LES STATISTIQUES =====
export interface NoteStatistiques {
  total_notes: number;
  moyenne_generale: number;
  repartition_par_type: Record<string, number>;
  repartition_par_periode: Record<string, number>;
  notes_par_tranche: Array<{
    tranche: string;
    nombre: number;
    pourcentage: number;
  }>;
  evolution_moyennes: Array<{
    periode: string;
    moyenne: number;
  }>;
}

export interface MoyenneEleve {
  eleve_id: number;
  eleve?: Eleve;
  moyenne_generale: number;
  moyennes_par_matiere: Array<{
    matiere_id: number;
    matiere?: Matiere;
    moyenne: number;
    nombre_notes: number;
  }>;
  rang?: number;
  mention?: string;
}

// ===== INTERFACE POUR LE RELEVÉ DE NOTES =====
export interface ReleveNotes {
  eleve: Eleve;
  periode: string;
  notes_par_matiere: Array<{
    matiere: Matiere;
    notes: Note[];
    moyenne: number;
    coefficient: number;
  }>;
  moyenne_generale: number;
  rang_classe?: number;
  total_eleves?: number;
  mention: string;
  observations?: string;
}

// ===== TYPES POUR LES FORMULAIRES =====
export interface NoteFormData {
  eleve_id: number;
  matiere_id: number;
  classe_id: number;
  valeur: number;
  type: TypeEvaluation;
  periode: TypePeriode;
  date_evaluation: string;
  coefficient: number;
  commentaire: string;
}

export interface NoteFormErrors {
  [key: string]: string[];
}

// ===== CONSTANTES =====
export const NOTE_RANGE = {
  MIN: 0,
  MAX: 20
} as const;

export const TYPES_EVALUATION: Array<{value: TypeEvaluation, label: string, color: string}> = [
  { value: 'devoir', label: 'Devoir', color: 'blue' },
  { value: 'controle', label: 'Contrôle', color: 'orange' },
  { value: 'examen', label: 'Examen', color: 'red' }
] as const;

export const PERIODES_TYPES: Array<{value: TypePeriode, label: string}> = [
  { value: 'trimestre1', label: '1er Trimestre' },
  { value: 'trimestre2', label: '2ème Trimestre' },
  { value: 'trimestre3', label: '3ème Trimestre' }
] as const;

export const MENTIONS = [
  { value: 'excellent', label: 'Excellent', min: 16, color: 'green' },
  { value: 'tres_bien', label: 'Très Bien', min: 14, color: 'blue' },
  { value: 'bien', label: 'Bien', min: 12, color: 'yellow' },
  { value: 'assez_bien', label: 'Assez Bien', min: 10, color: 'orange' },
  { value: 'passable', label: 'Passable', min: 8, color: 'red-400' },
  { value: 'insuffisant', label: 'Insuffisant', min: 0, color: 'red' }
] as const;

// ===== FONCTIONS UTILITAIRES =====
export function getTypeEvaluationLabel(type: TypeEvaluation): string {
  const typeObj = TYPES_EVALUATION.find(t => t.value === type);
  return typeObj ? typeObj.label : type;
}

export function getTypeEvaluationColor(type: TypeEvaluation): string {
  const typeObj = TYPES_EVALUATION.find(t => t.value === type);
  return typeObj ? typeObj.color : 'gray';
}

export function getMentionFromNote(note: number): string {
  for (const mention of MENTIONS) {
    if (note >= mention.min) {
      return mention.value;
    }
  }
  return 'insuffisant';
}

export function getMentionLabel(mentionValue: string): string {
  const mentionObj = MENTIONS.find(m => m.value === mentionValue);
  return mentionObj ? mentionObj.label : mentionValue;
}

export function getMentionColor(mentionValue: string): string {
  const mentionObj = MENTIONS.find(m => m.value === mentionValue);
  return mentionObj ? mentionObj.color : 'gray';
}

export function calculateMoyenne(notes: Note[]): number {
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

export function formatNote(note: number): string {
  return note.toFixed(2).replace('.', ',');
}

export function isNoteValide(note: number): boolean {
  return note >= NOTE_RANGE.MIN && note <= NOTE_RANGE.MAX;
}

// ===== INTERFACES POUR LES ACTIONS =====
export interface NoteAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  permission?: string;
  action: (note: Note) => void;
}

// ===== VALIDATION =====
export interface NoteValidationRules {
  valeur: {
    required: true;
    min: typeof NOTE_RANGE.MIN;
    max: typeof NOTE_RANGE.MAX;
  };
  type: {
    required: true;
    enum: typeof TYPES_EVALUATION;
  };
  periode: {
    required: true;
    enum: typeof PERIODES_TYPES;
  };
  date_evaluation: {
    required: true;
    format: 'date';
  };
}

// ===== INTERFACES POUR L'AFFICHAGE =====
export interface NoteWithDetails extends Note {
  eleve_nom_complet?: string;
  matiere_nom?: string;
  enseignant_nom_complet?: string;
  mention?: string;
  couleur_mention?: string;
  peut_modifier?: boolean;
}

