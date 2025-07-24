import { Eleve, Enseignant } from "./user.model";

// ===== INTERFACE PRINCIPALE =====
export interface Classe {
  id: number;
  nom: string;
  niveau: string;
  section: string;
  effectif_max: number;
  effectif_actuel: number;
  description?: string;
  actif: boolean;
  enseignants?: Enseignant[];
  eleves?: Eleve[];
  created_at: string;
  updated_at: string;
}

// ===== INTERFACES POUR LES REQUÊTES =====
export interface CreateClasseRequest {
  nom: string;
  niveau: string;
  section: string;
  effectif_max: number;
  description?: string;
}

export interface UpdateClasseRequest {
  nom?: string;
  niveau?: string;
  section?: string;
  effectif_max?: number;
  description?: string;
}

// ===== INTERFACES POUR LES FILTRES =====
export interface ClasseFilters {
  niveau?: string;
  actif?: boolean;
  recherche?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// ===== INTERFACE POUR LES STATISTIQUES =====
export interface ClasseStatistiques {
  total_classes: number;
  capacite_totale: number;
  taux_occupation: number;
  repartition_par_niveau: Record<string, number>;
  classes_actives: number;
  classes_inactives: number;
  effectif_moyen: number;
  classes_pleines: number;
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

// ===== INTERFACE POUR LA RÉPONSE API LARAVEL =====
export interface ClasseApiResponse {
  message: string;
  statut: 'succes' | 'erreur';
  classes: {
    current_page: number;
    data: Classe[];
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
export type ClasseFormData = {
  nom: string;
  niveau: string;
  section: string;
  effectif_max: number;
  description: string;
  enseignants_ids?: number[];
};

export interface ClasseFormErrors {
  [key: string]: string[];
}

// ===== CONSTANTES =====
export const NIVEAUX_DISPONIBLES = [
  '6ème', '5ème', '4ème', '3ème', 
  '2nde', '1ère', 'Terminale'
] as const;

export const SECTIONS_DISPONIBLES = [
  'A', 'B', 'C', 'D', 'E'
] as const;

export type NiveauScolaire = typeof NIVEAUX_DISPONIBLES[number];
export type SectionClasse = typeof SECTIONS_DISPONIBLES[number];

// ===== INTERFACES POUR LES ACTIONS =====
export interface ClasseAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  permission?: string;
  action: (classe: Classe) => void;
}

// ===== VALIDATION =====
export interface ClasseValidationRules {
  nom: {
    required: true;
    minLength: 2;
    maxLength: 50;
  };
  niveau: {
    required: true;
    enum: typeof NIVEAUX_DISPONIBLES;
  };
  section: {
    required: true;
    enum: typeof SECTIONS_DISPONIBLES;
  };
  effectif_max: {
    required: true;
    min: 1;
    max: 100;
  };
}