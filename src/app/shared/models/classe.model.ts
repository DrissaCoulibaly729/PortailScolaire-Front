// src/app/shared/models/classe.model.ts
import { Enseignant, Eleve } from "./user.model";

// ===== INTERFACE PRINCIPALE =====
export interface Classe {
  id: number;
  nom: string;
  niveau: string; // Changé de NiveauScolaire à string pour résoudre l'erreur
  section: string;
  effectif_max: number;
  effectif_actuel?: number;
  description?: string;
  actif: boolean; // Ajouté la propriété manquante
  moyenne: number;
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
  active?: boolean;
  recherche?: string;
  effectif_min?: number;
  effectif_max?: number;
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

// ===== INTERFACE POUR LES STATISTIQUES =====
export interface ClasseStatistiques {
  total_classes: number;
  actives: number;
  inactives: number;
  effectif_total: number;
  effectif_moyen: number;
  taux_occupation: number;
  total_eleves: number; // ✅ AJOUTÉ
  moyenne_generale: number; // ✅ AJOUTÉ
  repartition_par_niveau: Array<{
    niveau: string;
    nombre_classes: number;
    effectif_total: number;
  }>;
}

// ===== INTERFACE POUR LA RÉPONSE API =====
export interface ClasseApiResponse {
  message: string;
  statut: 'succes' | 'erreur';
  data?: any;
  erreurs?: { [key: string]: string[] };
}

// ===== TYPES POUR LES FORMULAIRES =====
export interface ClasseFormData {
  nom: string;
  niveau: string;
  section: string;
  effectif_max: number;
  description: string;
  enseignants_ids?: number[];
}

export interface ClasseFormErrors {
  [key: string]: string[];
}

// ===== CONSTANTES =====
export const NIVEAUX_DISPONIBLES = [
  { value: '6ème', label: '6ème' },
  { value: '5ème', label: '5ème' },
  { value: '4ème', label: '4ème' },
  { value: '3ème', label: '3ème' },
  { value: '2nde', label: '2nde' },
  { value: '1ère', label: '1ère' },
  { value: 'Terminale', label: 'Terminale' }
] as const;

export const SECTIONS_DISPONIBLES = [
  'A', 'B', 'C', 'D', 'E'
] as const;

// ===== TYPES UTILITAIRES =====
export type NiveauScolaire = string; // Simplifié pour éviter les erreurs de type
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