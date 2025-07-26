// src/app/shared/models/eleve-parent-dashboard.model.ts

export interface EnfantSummary {
  eleve: {
    id: number;
    nom: string;
    prenom: string;
    numero_etudiant: string;
    classe?: {
      id: number;
      nom: string;
      niveau: string;
    };
  };
  moyenneActuelle?: {
    moyenne_generale: number;
    mention: string;
    rang_classe?: number;
    coefficient_total?: number;
    nombre_notes?: number;
  };
  dernierBulletin?: {
    id: number;
    periode_nom: string;
    moyenne_generale: number;
    mention: string;
    pdf_url?: string;
    date_creation: string;
  };
  moyennesParMatiere?: MoyenneMatiere[];
  alertes: string[];
  progressionMensuelle?: {
    mois: string;
    moyenne: number;
  }[];
}

export interface MoyenneMatiere {
  matiere_id: number;
  matiere_nom: string;
  moyenne: number;
  nombre_notes: number;
  coefficient?: number;
  couleur?: string;
}

export interface DashboardData {
  statistiques: {
    totalEnfants: number;
    moyenneGeneraleGlobale: number;
    bulletinsDisponibles: number;
    prochainConseil?: string;
  };
  enfants: EnfantSummary[];
  derniersEvenements: EvenementRecent[];
  alertesUrgentes?: AlerteUrgente[];
}

export interface EvenementRecent {
  id: string;
  type: 'note' | 'bulletin' | 'conseil' | 'absence' | 'retard' | 'convocation';
  titre: string;
  description: string;
  date: string;
  urgent: boolean;
  enfant_id?: number;
  enfant_nom?: string;
}

export interface AlerteUrgente {
  id: string;
  type: 'note_faible' | 'absence_repetee' | 'retard_frequent' | 'convocation';
  message: string;
  enfant_id: number;
  enfant_nom: string;
  date_creation: string;
  resolu: boolean;
}

// Types pour les filtres et statistiques
export interface DashboardFilters {
  enfant_id?: number;
  periode?: string;
  matiere_id?: number;
  date_debut?: string;
  date_fin?: string;
}

export interface PerformanceEvolution {
  enfant_id: number;
  donnees: {
    periode: string;
    moyenne: number;
    rang?: number;
    total_eleves?: number;
  }[];
}

// Configuration des couleurs pour les moyennes
export const COULEURS_MOYENNES = {
  excellente: '#16a34a', // >= 16
  tres_bien: '#3b82f6', // >= 14
  bien: '#8b5cf6',       // >= 12
  assez_bien: '#f59e0b', // >= 10
  passable: '#ef4444',   // >= 8
  insuffisant: '#dc2626' // < 8
} as const;

// Configuration des mentions
export const MENTIONS = [
  { min: 16, value: 'excellente', label: 'Excellent', color: COULEURS_MOYENNES.excellente },
  { min: 14, value: 'tres_bien', label: 'Très bien', color: COULEURS_MOYENNES.tres_bien },
  { min: 12, value: 'bien', label: 'Bien', color: COULEURS_MOYENNES.bien },
  { min: 10, value: 'assez_bien', label: 'Assez bien', color: COULEURS_MOYENNES.assez_bien },
  { min: 8, value: 'passable', label: 'Passable', color: COULEURS_MOYENNES.passable },
  { min: 0, value: 'insuffisant', label: 'Insuffisant', color: COULEURS_MOYENNES.insuffisant }
] as const;

// Configuration des icônes pour les événements
export const ICONES_EVENEMENTS = {
  note: '📝',
  bulletin: '📄',
  conseil: '👥',
  absence: '❌',
  retard: '⏰',
  convocation: '📧'
} as const;