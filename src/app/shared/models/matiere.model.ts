import { Enseignant } from "./user.model";

// ===== INTERFACE PRINCIPALE =====
export interface Matiere {
  id: number;
  nom: string;
  code: string;
  coefficient: number;
  description?: string;
  actif: boolean;
  enseignants?: Enseignant[];
  notes_count?: number;
  moyenne_generale?: number;
  created_at: string;
  updated_at: string;
}

// ===== INTERFACES POUR LES REQUÊTES =====
export interface CreateMatiereRequest {
  nom: string;
  code: string;
  coefficient: number;
  description?: string;
}

export interface UpdateMatiereRequest {
  nom?: string;
  code?: string;
  coefficient?: number;
  description?: string;
}

// ===== INTERFACES POUR LES FILTRES =====
export interface MatiereFilters {
  actif?: boolean;
  recherche?: string;
  coefficient_min?: number;
  coefficient_max?: number;
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

// ===== INTERFACE POUR LES STATISTIQUES =====
export interface MatiereStatistiques {
  total_matieres: number;
  actives: number;
  inactives: number;
  notes_total: number;
  moyenne_coefficients: number;
  repartition_par_coefficient: Array<{
    coefficient: number;
    nombre_matieres: number;
  }>;
}

// ===== INTERFACE POUR LA RÉPONSE API LARAVEL =====
export interface MatiereApiResponse {
  message: string;
  statut: 'succes' | 'erreur';
  matieres: {
    current_page: number;
    data: Matiere[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
  };
}

// ===== TYPES UTILITAIRES =====
export type MatiereFormData = {
  nom: string;
  code: string;
  coefficient: number;
  description: string;
  enseignants_ids?: number[];
};

export interface MatiereFormErrors {
  [key: string]: string[];
}

// ===== CONSTANTES =====
export const COEFFICIENT_RANGE = {
  MIN: 0.5,
  MAX: 5.0,
  DEFAULT: 1.0
} as const;

export const MATIERES_COMMUNES = [
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
] as const;

// ===== INTERFACES POUR LES ACTIONS =====
export interface MatiereAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  permission?: string;
  action: (matiere: Matiere) => void;
}

// ===== VALIDATION =====
export interface MatiereValidationRules {
  nom: {
    required: true;
    minLength: 2;
    maxLength: 100;
  };
  code: {
    required: true;
    minLength: 2;
    maxLength: 10;
    unique: true;
  };
  coefficient: {
    required: true;
    min: typeof COEFFICIENT_RANGE.MIN;
    max: typeof COEFFICIENT_RANGE.MAX;
  };
}

// ===== TYPES POUR LES NOTES (RELATION) =====
export interface MatiereWithStats extends Matiere {
  total_notes: number;
  moyenne_generale: number;
  nombre_eleves: number;
  dernier_devoir?: string;
}