// src/app/shared/models/dashboard.model.ts

import {
  StatutBulletin,
  TypePeriode,
  Periode,
  Bulletin,
  NoteBulletin,
  BulletinFilters,
  GenerateBulletinRequest,
  
  MENTIONS_BULLETIN
} from './bulletin.model';
import { ApiResponse } from './api-response.model';
import { PaginatedResponse } from './common.model';

import {
  Note,
  TypeEvaluation,
  TYPES_EVALUATION,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteFilters,
  NoteStatistiques
} from './note.model';

// -----------------------------
// Types dérivés
// -----------------------------
export type Mention = (typeof MENTIONS_BULLETIN)[number]['value'];

// -----------------------------
// Interfaces "Dashboard"
// -----------------------------
export interface DashboardStats {
  message: string;
  statut: string;
  tableau_bord: {
    // ✅ SECTION UTILISATEURS - Structure exacte de votre API
    utilisateurs: {
      total: number;
      administrateurs: number;
      enseignants: number;
      eleves: number;
      actifs: number;
      inactifs: number;
      nouveaux_ce_mois: number;
      repartition_par_role: {
        eleve: number;
        enseignant: number;
        administrateur: number;
      };
    };

    // ✅ SECTION CLASSES - Structure exacte de votre API
    classes: {
      total: number;
      actives: number;
      inactives: number;
      effectif_total: number;
      capacite_totale: number;
      taux_occupation: number;
      repartition_par_niveau: Array<{
        niveau: string;
        nb_classes: number;
        capacite: number;
        eleves_count: number;
      }>;
      classes_pleines: number;
    };

    // ✅ SECTION MATIÈRES - Structure exacte de votre API
    matieres: {
      total: number;
      actives: number;
      inactives: number;
      avec_enseignants: number;
      sans_enseignants: number;
      coefficient_moyen: number;
      repartition_coefficients: Array<{
        coefficient: string;
        nombre: number;
      }>;
    };

    // ✅ SECTION ACADÉMIQUE - Structure exacte de votre API
    academique: {
      moyennes_par_classe: any[]; // Type plus spécifique si nécessaire
      moyenne_generale_ecole: number;
      nb_notes_total: number;
      notes_ce_mois: number;
      eleves_en_difficulte: any[]; // Type plus spécifique si nécessaire
      excellents_eleves: any[]; // Type plus spécifique si nécessaire
    };

    // ✅ SECTION BULLETINS - Structure exacte de votre API
    bulletins: {
      total_generes: number;
      disponibles: number;
      en_attente: number;
      generes_ce_mois: number;
      repartition_mentions: any[]; // Type plus spécifique si nécessaire
    };

    // ✅ SECTION ACTIVITÉ RÉCENTE - Structure exacte de votre API
    activite_recente: {
      derniers_utilisateurs: Array<{
        id: number;
        nom: string;
        prenom: string;
        role: string;
        created_at: string;
      }>;
      dernieres_notes: any[]; // Type plus spécifique si nécessaire
      derniers_bulletins: any[]; // Type plus spécifique si nécessaire
      connexions_recentes: Array<{
        id: number;
        nom: string;
        prenom: string;
        role: string;
        updated_at: string;
      }>;
    };
  };
}


export interface ActivityItem {
  id: string;
  type: 'user_created' | 'note_added' | 'bulletin_generated' | 'classe_updated' | 'matiere_created';
  message: string;
  timestamp: string;
  utilisateur: {
    nom: string;
    prenom: string;
  };
  metadata?: any;
}

export interface ElevePerformance {
  eleve_id: number;
  nom: string;
  prenom: string;
  classe: string;
  moyenne_generale: number;
  evolution: number;
  alertes?: string[];
}

export interface StatistiquesAvancees {
  evolution_inscriptions: {
    mois: string;
    nombre_inscriptions: number;
    cumul: number;
  }[];

  performance_par_matiere: {
    matiere: string;
    moyenne: number;
    nombre_notes: number;
    evolution: number;
  }[];

  taux_reussite_par_classe: {
    classe: string;
    niveau: string;
    taux_reussite: number;
    moyenne_classe: number;
    effectif: number;
  }[];

  distribution_notes: {
    tranche: string;
    nombre: number;
    pourcentage: number;
  }[];

  enseignants_activite: {
    enseignant: {
      nom: string;
      prenom: string;
    };
    nombre_notes_saisies: number;
    nombre_matieres: number;
    derniere_activite: string;
  }[];

  tendances_mensuelles: {
    mois: string;
    moyenne_generale: number;
    nombre_bulletins: number;
    taux_reussite: number;
  }[];
}

// -----------------------------
// Fonctions utilitaires (LOCALES AU DASHBOARD)
// (pas de re-déclaration / re-export en conflit)
// -----------------------------
export function getMentionFromNote(note: number): Mention {
  const m = MENTIONS_BULLETIN.find(m => note >= m.min);
  return m ? m.value : 'insuffisant';
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

export function calculateMoyenne(notes: Note[]): number {
  if (!notes?.length) return 0;

  let sommeNotes = 0;
  let sommeCoefficients = 0;

  for (const n of notes) {
    const coef = n.coefficient ?? 1;
    sommeNotes += n.valeur * coef;
    sommeCoefficients += coef;
  }

  return sommeCoefficients > 0 ? sommeNotes / sommeCoefficients : 0;
}

export function formatNote(note: number): string {
  return note.toFixed(2).replace('.', ',');
}

export function isNoteValide(note: number): boolean {
  return note >= 0 && note <= 20;
}

// -----------------------------
// Ré-export SÉLECTIF (uniquement ce qui est utile ici,
// et sans dupliquer ce qui est déjà exporté ailleurs)
// -----------------------------
export type {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteFilters,
  NoteStatistiques,
  TypeEvaluation,
  Periode,
  TypePeriode,
  Bulletin,
  NoteBulletin,
  StatutBulletin,
  BulletinFilters,
  GenerateBulletinRequest,
  PaginatedResponse,
  ApiResponse
};
