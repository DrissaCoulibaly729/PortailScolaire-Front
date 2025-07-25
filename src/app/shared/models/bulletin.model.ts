// src/app/shared/models/bulletin.model.ts
import { Eleve } from "./user.model";
import { Classe } from "./classe.model";
import { Note } from "./note.model";

// ===== TYPES DE BASE =====
export type StatutBulletin = 'brouillon' | 'publie' | 'archive';
export type TypePeriode = 'trimestre1' | 'trimestre2' | 'trimestre3' | 'semestre1' | 'semestre2' | 'annuel';

// ===== INTERFACE PERIODE =====
export interface Periode {
  id: number;
  nom: string;
  type: TypePeriode;
  date_debut: string;
  date_fin: string;
  actif: boolean;
  annee_scolaire: string;
  created_at: string;
  updated_at: string;
}

// ===== INTERFACE NOTE BULLETIN =====
export interface NoteBulletin {
  id: number;
  bulletin_id: number;
  matiere_id: number;
  matiere_nom: string;
  matiere_code: string;
  coefficient: number;
  notes: Note[];
  moyenne: number;
  rang?: number;
  appreciation?: string;
}

// ===== INTERFACE BULLETIN PRINCIPALE =====
export interface Bulletin {
  id: number;
  eleve_id: number;
  classe_id: number;
  periode_id: number;
  annee_scolaire: string;
  moyenne_generale: number;
  rang_classe?: number;
  total_eleves?: number;
  mention: string;
  statut: StatutBulletin;
  observations_generales?: string;
  appreciation_conseil?: string;
  date_conseil?: string;
  absences_justifiees?: number;
  absences_non_justifiees?: number;
  retards?: number;
  sanctions?: string;
  felicitations?: boolean;
  encouragements?: boolean;
  avertissement_travail?: boolean;
  avertissement_conduite?: boolean;
  blason?: boolean;
  
  // Relations
  eleve?: Eleve;
  classe?: Classe;
  periode?: Periode;
  notes_bulletins?: NoteBulletin[];
  
  // Métadonnées
  genere_le?: string;
  genere_par?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

// ===== INTERFACES POUR LES REQUÊTES =====
export interface GenerateBulletinRequest {
  eleve_id: number;
  periode_id: number;
  classe_id: number;
  observations_generales?: string;
  appreciation_conseil?: string;
  date_conseil?: string;
  absences_justifiees?: number;
  absences_non_justifiees?: number;
  retards?: number;
  sanctions?: string;
  felicitations?: boolean;
  encouragements?: boolean;
  avertissement_travail?: boolean;
  avertissement_conduite?: boolean;
  blason?: boolean;
}

export interface UpdateBulletinRequest {
  observations_generales?: string;
  appreciation_conseil?: string;
  date_conseil?: string;
  absences_justifiees?: number;
  absences_non_justifiees?: number;
  retards?: number;
  sanctions?: string;
  felicitations?: boolean;
  encouragements?: boolean;
  avertissement_travail?: boolean;
  avertissement_conduite?: boolean;
  blason?: boolean;
}

// ===== INTERFACES POUR LES FILTRES =====
export interface BulletinFilters {
  eleve_id?: number;
  classe_id?: number;
  periode_id?: number;
  annee_scolaire?: string;
  statut?: StatutBulletin;
  moyenne_min?: number;
  moyenne_max?: number;
  mention?: string;
  date_debut?: string;
  date_fin?: string;
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

// ===== STATISTIQUES DE BULLETIN =====
export interface BulletinStatistiques {
  total_bulletins: number;
  par_statut: Record<StatutBulletin, number>;
  moyenne_generale_classe: number;
  repartition_mentions: Array<{
    mention: string;
    nombre: number;
    pourcentage: number;
  }>;
  evolution_moyennes: Array<{
    periode: string;
    moyenne: number;
  }>;
}

// ===== CONSTANTES =====
export const STATUTS_BULLETIN: Array<{value: StatutBulletin, label: string, color: string}> = [
  { value: 'brouillon', label: 'Brouillon', color: 'gray' },
  { value: 'publie', label: 'Publié', color: 'green' },
  { value: 'archive', label: 'Archivé', color: 'blue' }
] as const;

export const PERIODES_TYPES: Array<{value: TypePeriode, label: string}> = [
  { value: 'trimestre1', label: '1er Trimestre' },
  { value: 'trimestre2', label: '2ème Trimestre' },
  { value: 'trimestre3', label: '3ème Trimestre' },
  { value: 'semestre1', label: '1er Semestre' },
  { value: 'semestre2', label: '2ème Semestre' },
  { value: 'annuel', label: 'Annuel' }
] as const;

export const MENTIONS_BULLETIN = [
  { value: 'excellent', label: 'Excellent', min: 16, color: 'green' },
  { value: 'tres_bien', label: 'Très Bien', min: 14, color: 'blue' },
  { value: 'bien', label: 'Bien', min: 12, color: 'yellow' },
  { value: 'assez_bien', label: 'Assez Bien', min: 10, color: 'orange' },
  { value: 'passable', label: 'Passable', min: 8, color: 'red-400' },
  { value: 'insuffisant', label: 'Insuffisant', min: 0, color: 'red' }
] as const;

// ===== FONCTIONS UTILITAIRES =====
export function getStatutBulletinLabel(statut: StatutBulletin): string {
  const statutObj = STATUTS_BULLETIN.find(s => s.value === statut);
  return statutObj ? statutObj.label : statut;
}

export function getStatutBulletinColor(statut: StatutBulletin): string {
  const statutObj = STATUTS_BULLETIN.find(s => s.value === statut);
  return statutObj ? statutObj.color : 'gray';
}

export function getPeriodeLabel(type: TypePeriode): string {
  const periodeObj = PERIODES_TYPES.find(p => p.value === type);
  return periodeObj ? periodeObj.label : type;
}

export function getMentionFromMoyenne(moyenne: number): string {
  for (const mention of MENTIONS_BULLETIN) {
    if (moyenne >= mention.min) {
      return mention.value;
    }
  }
  return 'insuffisant';
}

export function getMentionLabel(mentionValue: string): string {
  const mentionObj = MENTIONS_BULLETIN.find(m => m.value === mentionValue);
  return mentionObj ? mentionObj.label : mentionValue;
}

export function getMentionColor(mentionValue: string): string {
  const mentionObj = MENTIONS_BULLETIN.find(m => m.value === mentionValue);
  return mentionObj ? mentionObj.color : 'gray';
}

// ===== INTERFACES POUR LES ACTIONS =====
export interface BulletinAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  permission?: string;
  action: (bulletin: Bulletin) => void;
}

// ===== TYPES POUR LES FORMULAIRES =====
export interface BulletinFormData {
  eleve_id: number;
  periode_id: number;
  classe_id: number;
  observations_generales: string;
  appreciation_conseil: string;
  date_conseil: string;
  absences_justifiees: number;
  absences_non_justifiees: number;
  retards: number;
  sanctions: string;
  felicitations: boolean;
  encouragements: boolean;
  avertissement_travail: boolean;
  avertissement_conduite: boolean;
  blason: boolean;
}

export interface BulletinFormErrors {
  [key: string]: string[];
}