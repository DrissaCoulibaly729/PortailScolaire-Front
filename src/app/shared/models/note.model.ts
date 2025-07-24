import { Matiere } from "./matiere.model";
import { Eleve, Enseignant } from "./user.model";

// ===== INTERFACE PRINCIPALE =====
export interface Note {
  id: number;
  eleve_id: number;
  matiere_id: number;
  enseignant_id: number;
  classe_id: number;
  valeur: number;
  type: 'devoir' | 'controle' | 'examen';
  periode: 'trimestre1' | 'trimestre2' | 'trimestre3';
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
  type: 'devoir' | 'controle' | 'examen';
  periode: 'trimestre1' | 'trimestre2' | 'trimestre3';
  date_evaluation: string;
  commentaire?: string;
}

export interface UpdateNoteRequest {
  valeur?: number;
  type?: 'devoir' | 'controle' | 'examen';
  date_evaluation?: string;
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

// ===== INTERFACE POUR LA PAGINATION (PARTAGÉE) =====
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
export interface NotesStatistiques {
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

// ===== TYPES UTILITAIRES =====
export type TypeNote = 'devoir' | 'controle' | 'examen';
export type PeriodeNote = 'trimestre1' | 'trimestre2' | 'trimestre3';

export interface NoteFormData {
  eleve_id: number;
  matiere_id: number;
  classe_id: number;
  valeur: number;
  type: TypeNote;
  periode: PeriodeNote;
  date_evaluation: string;
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

export const TYPES_NOTES: Array<{value: TypeNote, label: string}> = [
  { value: 'devoir', label: 'Devoir' },
  { value: 'controle', label: 'Contrôle' },
  { value: 'examen', label: 'Examen' }
] as const;

export const PERIODES_NOTES: Array<{value: PeriodeNote, label: string}> = [
  { value: 'trimestre1', label: '1er Trimestre' },
  { value: 'trimestre2', label: '2ème Trimestre' },
  { value: 'trimestre3', label: '3ème Trimestre' }
] as const;

export const MENTIONS_NOTES = {
  EXCELLENT: { min: 16, label: 'Excellent', color: 'green' },
  TRES_BIEN: { min: 14, label: 'Très Bien', color: 'blue' },
  BIEN: { min: 12, label: 'Bien', color: 'yellow' },
  ASSEZ_BIEN: { min: 10, label: 'Assez Bien', color: 'orange' },
  PASSABLE: { min: 8, label: 'Passable', color: 'red-400' },
  INSUFFISANT: { min: 0, label: 'Insuffisant', color: 'red' }
} as const;

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
    enum: typeof TYPES_NOTES;
  };
  periode: {
    required: true;
    enum: typeof PERIODES_NOTES;
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