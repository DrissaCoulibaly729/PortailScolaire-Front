// src/app/shared/models/note.model.ts

import { Matiere } from "./matiere.model";
import { Eleve, Enseignant } from "./user.model";
import { ApiResponse } from './api-response.model';

// ===== TYPES DE BASE =====
export type TypeEvaluation = 'devoir' | 'controle' | 'examen';
export type TypePeriode = 'trimestre1' | 'trimestre2' | 'trimestre3';
export type Mention = 'excellent' | 'tres_bien' | 'bien' | 'assez_bien' | 'passable' | 'insuffisant';

// ===== INTERFACE PRINCIPALE =====
export interface Note {
  id: number;
  eleve_id: number;
  matiere_id: number;
  enseignant_id: number;
  classe_id: number;
  valeur: number;
  type: TypeEvaluation;
  type_evaluation: TypeEvaluation; // Alias pour compatibilité backend
  periode: TypePeriode;
  coefficient: number; // Obligatoire, par défaut 1
  date_evaluation: string;
  commentaire?: string;
  
  // Relations (chargées selon le contexte)
  eleve?: Eleve;
  matiere?: Matiere;
  enseignant?: Enseignant;
  
  // Métadonnées
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
  coefficient?: number; // Par défaut 1 côté backend
  commentaire?: string;
}

export interface UpdateNoteRequest {
  valeur?: number;
  type?: TypeEvaluation;
  periode?: TypePeriode;
  date_evaluation?: string;
  coefficient?: number;
  commentaire?: string;
}

export interface CreateNotesBatchRequest {
  notes: CreateNoteRequest[];
  matiere_id?: number; // Si toutes les notes sont pour la même matière
  classe_id?: number;  // Si toutes les notes sont pour la même classe
  type?: TypeEvaluation; // Si toutes les notes ont le même type
  periode?: TypePeriode; // Si toutes les notes sont pour la même période
  date_evaluation?: string; // Si toutes les notes ont la même date
  coefficient?: number; // Si toutes les notes ont le même coefficient
}

// ===== INTERFACES POUR LES FILTRES =====
export interface NoteFilters {
  eleve_id?: number;
  matiere_id?: number;
  classe_id?: number;
  enseignant_id?: number;
  type?: TypeEvaluation;
  periode?: TypePeriode;
  date_debut?: string;
  date_fin?: string;
  note_min?: number;
  note_max?: number;
  avec_relations?: boolean; // Pour charger eleve, matiere, enseignant
  search?: string; // Recherche sur nom élève ou matière
  
  // Pagination
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// ===== INTERFACES POUR LES OPÉRATIONS GROUPÉES =====
export interface BulkNoteOperation {
  operation: 'create' | 'update' | 'delete';
  notes: Array<CreateNoteRequest | (UpdateNoteRequest & { id: number })>;
}

export interface BulkNoteResult {
  success: number;
  errors: number;
  total: number;
  details?: Array<{
    note: any;
    error?: string;
    success?: boolean;
    index?: number;
  }>;
  messages?: string[];
}

// ===== INTERFACES POUR LES STATISTIQUES =====
export interface NoteStatistiques {
  total_notes: number;
  moyenne_generale: number;
  note_min: number;
  note_max: number;
  
  repartition_par_type: Record<TypeEvaluation, number>;
  repartition_par_periode: Record<TypePeriode, number>;
  repartition_par_mention: Record<Mention, number>;
  
  notes_par_tranche: Array<{
    tranche: string; // "0-5", "5-10", etc.
    nombre: number;
    pourcentage: number;
  }>;
  
  evolution_moyennes: Array<{
    periode: TypePeriode;
    moyenne: number;
    nombre_notes: number;
  }>;
  
  top_eleves: Array<{
    eleve_id: number;
    eleve?: Eleve;
    moyenne: number;
    nombre_notes: number;
  }>;
  
  matieres_stats: Array<{
    matiere_id: number;
    matiere?: Matiere;
    moyenne: number;
    nombre_notes: number;
    coefficient_moyen: number;
  }>;
}

export interface MoyenneEleve {
  eleve_id: number;
  eleve?: Eleve;
  moyenne_generale: number;
  rang?: number;
  mention?: Mention;
  
  moyennes_par_matiere: Array<{
    matiere_id: number;
    matiere?: Matiere;
    moyenne: number;
    nombre_notes: number;
    coefficient: number;
  }>;
  
  moyennes_par_periode: Array<{
    periode: TypePeriode;
    moyenne: number;
    nombre_notes: number;
  }>;
  
  progression: {
    evolution: number; // Différence avec la période précédente
    tendance: 'hausse' | 'baisse' | 'stable';
  };
}

// ===== INTERFACES POUR LES FORMULAIRES =====
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

export interface NoteBatchFormData {
  matiere_id: number;
  classe_id: number;
  type: TypeEvaluation;
  periode: TypePeriode;
  date_evaluation: string;
  coefficient: number;
  eleves: Array<{
    eleve_id: number;
    nom: string;
    prenom: string;
    numero_etudiant?: string;
    note?: number;
    commentaire?: string;
  }>;
}

// ===== CONSTANTES =====
export const TYPES_EVALUATION: Array<{
  value: TypeEvaluation;
  label: string;
  color: string;
  description: string;
}> = [
  {
    value: 'devoir',
    label: 'Devoir',
    color: 'blue',
    description: 'Devoir en classe ou à la maison'
  },
  {
    value: 'controle',
    label: 'Contrôle',
    color: 'orange',
    description: 'Contrôle continu'
  },
  {
    value: 'examen',
    label: 'Examen',
    color: 'red',
    description: 'Examen de fin de période'
  }
];

export const PERIODES: Array<{
  value: TypePeriode;
  label: string;
  order: number;
}> = [
  { value: 'trimestre1', label: '1er Trimestre', order: 1 },
  { value: 'trimestre2', label: '2ème Trimestre', order: 2 },
  { value: 'trimestre3', label: '3ème Trimestre', order: 3 }
];

export const MENTIONS_BULLETIN: Array<{
  value: Mention;
  label: string;
  color: string;
  min: number;
}> = [
  { value: 'excellent', label: 'Excellent', color: 'green', min: 16 },
  { value: 'tres_bien', label: 'Très Bien', color: 'blue', min: 14 },
  { value: 'bien', label: 'Bien', color: 'indigo', min: 12 },
  { value: 'assez_bien', label: 'Assez Bien', color: 'yellow', min: 10 },
  { value: 'passable', label: 'Passable', color: 'orange', min: 8 },
  { value: 'insuffisant', label: 'Insuffisant', color: 'red', min: 0 }
];

// ===== FONCTIONS UTILITAIRES =====
export function getMentionFromNote(note: number): Mention {
  const mention = MENTIONS_BULLETIN.find(m => note >= m.min);
  return mention ? mention.value : 'insuffisant';
}

export function getMentionLabel(mention: Mention): string {
  return MENTIONS_BULLETIN.find(m => m.value === mention)?.label ?? mention;
}

export function getMentionColor(mention: Mention): string {
  return MENTIONS_BULLETIN.find(m => m.value === mention)?.color ?? 'gray';
}

export function getTypeEvaluationLabel(type: TypeEvaluation): string {
  return TYPES_EVALUATION.find(t => t.value === type)?.label ?? type;
}

export function getTypeEvaluationColor(type: TypeEvaluation): string {
  return TYPES_EVALUATION.find(t => t.value === type)?.color ?? 'gray';
}

export function getPeriodeLabel(periode: TypePeriode): string {
  return PERIODES.find(p => p.value === periode)?.label ?? periode;
}

export function calculateMoyenne(notes: Note[]): number {
  if (!notes?.length) return 0;

  let sommeNotes = 0;
  let sommeCoefficients = 0;

  for (const note of notes) {
    const coef = note.coefficient ?? 1;
    sommeNotes += note.valeur * coef;
    sommeCoefficients += coef;
  }

  return sommeCoefficients > 0 ? Math.round((sommeNotes / sommeCoefficients) * 100) / 100 : 0;
}

export function formatNote(note: number): string {
  return note.toFixed(2).replace('.', ',');
}

export function isNoteValide(note: number): boolean {
  return note >= 0 && note <= 20;
}

export function compareNotes(a: Note, b: Note, sortBy: string = 'date_evaluation', direction: 'asc' | 'desc' = 'desc'): number {
  let comparison = 0;
  
  switch (sortBy) {
    case 'valeur':
      comparison = a.valeur - b.valeur;
      break;
    case 'date_evaluation':
      comparison = new Date(a.date_evaluation).getTime() - new Date(b.date_evaluation).getTime();
      break;
    case 'type':
      comparison = a.type.localeCompare(b.type);
      break;
    case 'periode':
      const orderA = PERIODES.find(p => p.value === a.periode)?.order ?? 0;
      const orderB = PERIODES.find(p => p.value === b.periode)?.order ?? 0;
      comparison = orderA - orderB;
      break;
    default:
      comparison = 0;
  }
  
  return direction === 'asc' ? comparison : -comparison;
}