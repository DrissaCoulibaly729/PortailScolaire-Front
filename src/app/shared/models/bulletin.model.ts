import { Classe } from "./classe.model";
import { Matiere } from "./matiere.model";
import { Note } from "./note.model";
import { Eleve } from "./user.model";

export interface Bulletin {
  id: number;
  eleve_id: number;
  classe_id: number;
  periode: 'trimestre1' | 'trimestre2' | 'trimestre3';
  annee_scolaire: string;
  moyenne_generale: number;
  rang: number;
  mention: string;
  appreciation_generale?: string;
  notes_par_matiere: NoteBulletin[];
  eleve?: Eleve;
  classe?: Classe;
  generated_at: string;
}

export interface NoteBulletin {
  matiere: Matiere;
  notes: Note[];
  moyenne: number;
  appreciation?: string;
}