import { Bulletin } from "./bulletin.model";
import { Classe } from "./classe.model";
import { Matiere } from "./matiere.model";
import { Note } from "./note.model";

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  date_naissance?: string;
  adresse?: string;
  role: UserRole;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enseignant extends User {
  identifiant_connexion: string;
  matieres?: Matiere[];
  classes?: Classe[];
}

export interface Eleve extends User {
  numero_etudiant: string;
  classe_id: number;
  classe?: Classe;
  nom_parent: string;
  prenom_parent: string;
  telephone_parent: string;
  email_parent: string;
  notes?: Note[];
  bulletins?: Bulletin[];
}

export interface Administrateur extends User {
  // Propriétés spécifiques aux administrateurs
  permissions?: string[];
}

export type UserRole = 'administrateur' | 'enseignant' | 'eleve';
