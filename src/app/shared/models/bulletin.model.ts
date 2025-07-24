import { Periode } from "./notes-bulletins.model";

export interface Bulletin {
  id: number;
  eleve_id: number;
  classe_id: number;
  periode_id: number;
  moyenne_generale: number;
  rang?: number;
  mention: Mention;
  appreciation_generale?: string;
  date_generation: string;
  statut: StatutBulletin;
  url_pdf?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relations
  eleve?: {
    id: number;
    nom: string;
    prenom: string;
    numero_etudiant?: string;
    date_naissance?: string;
  };
  classe?: {
    id: number;
    nom: string;
    niveau: string;
    section?: string;
  };
  periode?: Periode;
  notes_par_matiere?: NoteBulletin[];
  statistiques_classe?: {
    moyenne_classe: number;
    nombre_eleves: number;
    rang_eleve: number;
  };
}

export interface NoteBulletin {
  matiere_id: number;
  matiere_nom: string;
  matiere_code: string;
  coefficient: number;
  moyenne: number;
  nombre_notes: number;
  appreciation?: string;
  enseignant?: {
    nom: string;
    prenom: string;
  };
}

export type Mention = 'excellent' | 'tres_bien' | 'bien' | 'assez_bien' | 'passable' | 'insuffisant';

export const MENTIONS: { value: Mention; label: string; color: string; seuil_min: number }[] = [
  { value: 'excellent', label: 'Excellent', color: 'green', seuil_min: 18 },
  { value: 'tres_bien', label: 'Très Bien', color: 'blue', seuil_min: 16 },
  { value: 'bien', label: 'Bien', color: 'indigo', seuil_min: 14 },
  { value: 'assez_bien', label: 'Assez Bien', color: 'yellow', seuil_min: 12 },
  { value: 'passable', label: 'Passable', color: 'orange', seuil_min: 10 },
  { value: 'insuffisant', label: 'Insuffisant', color: 'red', seuil_min: 0 }
];

export type StatutBulletin = 'brouillon' | 'valide' | 'envoye' | 'archive';

export const STATUTS_BULLETIN: { value: StatutBulletin; label: string; color: string }[] = [
  { value: 'brouillon', label: 'Brouillon', color: 'gray' },
  { value: 'valide', label: 'Validé', color: 'green' },
  { value: 'envoye', label: 'Envoyé', color: 'blue' },
  { value: 'archive', label: 'Archivé', color: 'purple' }
];

export interface BulletinFilters {
  eleve_id?: number;
  classe_id?: number;
  periode_id?: number;
  annee_scolaire?: string;
  statut?: StatutBulletin;
  mention?: Mention;
  page?: number;
  per_page?: number;
}

export interface GenerateBulletinRequest {
  eleve_id: number;
  periode_id: number;
  appreciation_generale?: string;
  envoyer_notification?: boolean;
}