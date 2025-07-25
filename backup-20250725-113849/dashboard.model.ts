import { Mention } from "./bulletin.model";

export interface DashboardStats {
  utilisateurs: {
    total: number;
    administrateurs: number;
    enseignants: number;
    eleves: number;
    actifs: number;
    inactifs: number;
    nouveaux_ce_mois: number;
    evolution_mensuelle: number;
  };
  
  classes: {
    total: number;
    actives: number;
    inactives: number;
    effectif_total: number;
    effectif_moyen: number;
    taux_occupation: number;
    classe_la_plus_nombreuse: {
      nom: string;
      effectif: number;
    };
  };
  
  matieres: {
    total: number;
    actives: number;
    inactives: number;
    coefficient_moyen: number;
    enseignants_affectes: number;
    matiere_plus_enseignants: {
      nom: string;
      nombre_enseignants: number;
    };
  };
  
  notes: {
    total_notes: number;
    moyenne_generale: number;
    notes_ce_mois: number;
    evolution_notes: number;
    repartition_mentions: {
      mention: Mention;
      nombre: number;
      pourcentage: number;
    }[];
  };
  
  activite_recente: ActivityItem[];
  eleves_en_difficulte: ElevePerformance[];
  excellents_eleves: ElevePerformance[];
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

// ===== Utility Functions =====
export function getMentionFromNote(note: number): Mention {
  for (const mention of MENTIONS) {
    if (note >= mention.seuil_min) {
      return mention.value;
    }
  }
  return 'insuffisant';
}

export function getMentionLabel(mention: Mention): string {
  const mentionObj = MENTIONS.find(m => m.value === mention);
  return mentionObj?.label || mention;
}

export function getMentionColor(mention: Mention): string {
  const mentionObj = MENTIONS.find(m => m.value === mention);
  return mentionObj?.color || 'gray';
}

export function getTypeEvaluationLabel(type: TypeEvaluation): string {
  const typeObj = TYPES_EVALUATION.find(t => t.value === type);
  return typeObj?.label || type;
}

export function getTypeEvaluationColor(type: TypeEvaluation): string {
  const typeObj = TYPES_EVALUATION.find(t => t.value === type);
  return typeObj?.color || 'gray';
}

export function calculateMoyenne(notes: Note[]): number {
  if (notes.length === 0) return 0;
  
  let sommeNotes = 0;
  let sommeCoefficients = 0;
  
  notes.forEach(note => {
    const coefficient = note.coefficient || 1;
    sommeNotes += note.valeur * coefficient;
    sommeCoefficients += coefficient;
  });
  
  return sommeCoefficients > 0 ? sommeNotes / sommeCoefficients : 0;
}

export function formatNote(note: number): string {
  return note.toFixed(2).replace('.', ',');
}

export function isNoteValide(note: number): boolean {
  return note >= 0 && note <= 20;
}

// ===== API Response Types =====
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export interface ApiResponse<T> {
  message: string;
  statut: 'succes' | 'erreur';
  data: T;
  erreurs?: { [key: string]: string[] };
}

// ===== Export All Types =====
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
  Mention,
  StatutBulletin,
  BulletinFilters,
  GenerateBulletinRequest,
  DashboardStats,
  ActivityItem,
  ElevePerformance,
  StatistiquesAvancees,
  PaginatedResponse,
  ApiResponse
};

// ===== Constants Export =====
export {
  TYPES_EVALUATION,
  PERIODES_TYPES,
  MENTIONS,
  STATUTS_BULLETIN,
  getMentionFromNote,
  getMentionLabel,
  getMentionColor,
  getTypeEvaluationLabel,
  getTypeEvaluationColor,
  calculateMoyenne,
  formatNote,
  isNoteValide
};