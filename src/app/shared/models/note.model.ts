import { Matiere } from "./matiere.model";
import { Eleve, Enseignant } from "./user.model";

export interface Note {
  id: number;
  eleve_id: number;
  matiere_id: number;
  enseignant_id: number;
  classe_id: number;
  valeur: number;
  type: 'devoir' | 'controle' | 'examen';
  periode: 'trimestre1' | 'trimestre2' | 'trimestre3';
  date_evaluation: string;
  commentaire?: string;
  eleve?: Eleve;
  matiere?: Matiere;
  enseignant?: Enseignant;
  created_at: string;
  updated_at: string;
}
