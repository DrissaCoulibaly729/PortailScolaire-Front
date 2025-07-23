import { Eleve, Enseignant } from "./user.model";

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

export interface ClasseStatistiques {
  total_classes: number;
  capacite_totale: number;
  taux_occupation: number;
  repartition_par_niveau: Record<string, number>;
}


