import { Classe } from "./classe.model";
import { Matiere } from "./matiere.model";
import { Eleve, Enseignant, User, UserRole } from "./user.model";

export interface DashboardStats {
  statistiques_utilisateurs: {
    total: number;
    par_role: Record<UserRole, number>;
    actifs: number;
    inactifs: number;
  };
  statistiques_classes: {
    total: number;
    effectif_total: number;
    taux_occupation: number;
  };
  statistiques_matieres: {
    total: number;
    notes_saisies: number;
  };
  activite_recente: ActiviteRecente[];
  eleves_en_difficulte: Eleve[];
  excellents_eleves: Eleve[];
}

export interface ActiviteRecente {
  id: number;
  type: 'inscription' | 'note_saisie' | 'bulletin_genere';
  description: string;
  date: string;
  user?: User;
}

export interface StatistiquesAvancees {
  evolution_inscriptions: EvolutionInscription[];
  performance_par_matiere: PerformanceMatiere[];
  taux_reussite_par_classe: TauxReussiteClasse[];
  distribution_notes: DistributionNote[];
  enseignants_actifs: EnseignantActif[];
}

export interface EvolutionInscription {
  mois: string;
  nombre_inscriptions: number;
}

export interface PerformanceMatiere {
  matiere: Matiere;
  moyenne_generale: number;
  nombre_notes: number;
}

export interface TauxReussiteClasse {
  classe: Classe;
  taux_reussite: number;
  moyenne_classe: number;
}

export interface DistributionNote {
  tranche: string;
  nombre_eleves: number;
  pourcentage: number;
}

export interface EnseignantActif {
  enseignant: Enseignant;
  nombre_notes_saisies: number;
  derniere_activite: string;
}