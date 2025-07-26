import { Bulletin } from "./bulletin.model";
import { Classe } from "./classe.model";
import { Matiere } from "./matiere.model";
import { Note } from "./note.model";

// ===== INTERFACES DE BASE =====

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
  photo_url?: string;
  documents?: UserDocument[];
  identifiant_genere?: string;
}

export interface Enseignant extends User {
  identifiant_connexion: string;
  matieres?: Matiere[];
  classes?: Classe[];
  specialite?: string;
  diplomes?: string;
  experience_annees?: number;
}

export interface Eleve extends User {
  numero_etudiant: string;
  classe_id: number;
  classe?: Classe;
  nom_parent: string;
  prenom_parent: string;
  telephone_parent: string;
  email_parent: string;
  adresse_parent?: string;
  profession_parent?: string;
  notes?: Note[];
  bulletins?: Bulletin[];
  moyenne_generale?: number;
  rang_classe?: number;
}

export interface Administrateur extends User {
  permissions?: string[];
  derniere_connexion?: string;
}

export type UserRole = 'administrateur' | 'enseignant' | 'eleve';

// ===== INTERFACES POUR LES DOCUMENTS =====

export interface UserDocument {
  id: number;
  user_id: number;
  nom_fichier: string;
  type_document: DocumentType;
  taille_fichier: number;
  url_fichier: string;
  uploaded_at: string;
}

export type DocumentType = 
  | 'photo_identite'
  | 'acte_naissance' 
  | 'certificat_scolarite'
  | 'diplome'
  | 'cv'
  | 'autorisation_parentale'
  | 'certificat_medical'
  | 'justificatif_domicile';

// ===== INTERFACES POUR LES REQUÊTES =====

export interface CreateEnseignantRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  date_naissance?: string;
  adresse?: string;
  specialite?: string;
  diplomes?: string;
  experience_annees?: number;
  matieres_ids?: number[];
  classes_ids?: number[];
}

export interface CreateEleveRequest {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  date_naissance: string;
  adresse?: string;
  classe_id: number;
  nom_parent: string;
  prenom_parent: string;
  telephone_parent: string;
  email_parent: string;
  adresse_parent?: string;
  profession_parent?: string;
}

export interface UpdateUserRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  date_naissance?: string;
  adresse?: string;
  // Champs spécifiques selon le rôle
  specialite?: string; // Enseignant
  diplomes?: string; // Enseignant
  experience_annees?: number; // Enseignant
  classe_id?: number; // Élève
  nom_parent?: string; // Élève
  prenom_parent?: string; // Élève
  telephone_parent?: string; // Élève
  email_parent?: string; // Élève
  adresse_parent?: string; // Élève
  profession_parent?: string; // Élève
}

// ===== INTERFACES POUR LES FILTRES =====

export interface UserFilters {
  role?: UserRole;
  actif?: boolean;
  recherche?: string;
  classe_id?: number;
  matiere_id?: number;
  age_min?: number;
  age_max?: number;
  date_creation_debut?: string;
  date_creation_fin?: string;
  page?: number;
  per_page?: number;
  sort_by?: UserSortField;
  sort_direction?: 'asc' | 'desc';
}

export interface ClasseFilters {
  active?: boolean;
  niveau?: string;
  recherche?: string;
  enseignant_id?: number; // ✅ AJOUTÉ
  effectif_min?: number;
  effectif_max?: number;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export type UserSortField = 
  | 'nom' 
  | 'prenom' 
  | 'email' 
  | 'role' 
  | 'created_at' 
  | 'updated_at'
  | 'classe'
  | 'moyenne_generale';

// ===== INTERFACE UNIFIÉE POUR LA PAGINATION =====

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
}

// ===== INTERFACE POUR LA RÉPONSE BRUTE DE VOTRE API LARAVEL =====

export interface LaravelApiResponse<T> {
  message: string;
  statut: 'succes' | 'erreur';
  utilisateurs: {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      actif: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
  };
  filtres: {
    role: string | null;
    actif: string | null;
    recherche: string | null;
  };
}

// ===== INTERFACES POUR LES RÉPONSES =====

export interface UserStats {
  total_utilisateurs: number;
  par_role: Record<UserRole, number>;
  actifs: number;
  inactifs: number;
  nouveaux_ce_mois: number;
  repartition_par_age: AgeGroup[];
  derniers_inscrits: User[];
}

export interface AgeGroup {
  tranche_age: string;
  nombre: number;
  pourcentage: number;
}

// ===== INTERFACES POUR LES ACTIONS =====

export interface UserAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  permission?: string;
  action: (user: User) => void;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  confirmationMessage?: string;
  action: (userIds: number[]) => void;
}

// ===== TYPES UTILITAIRES =====

export interface UserFormData {
  // Informations personnelles
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_naissance: string;
  adresse: string;
  role: UserRole;
  
  // Champs conditionnels selon le rôle
  // Enseignant
  specialite?: string;
  diplomes?: string;
  experience_annees?: number;
  matieres_ids?: number[];
  classes_ids?: number[];
  
  // Élève
  classe_id?: number;
  nom_parent?: string;
  prenom_parent?: string;
  telephone_parent?: string;
  email_parent?: string;
  adresse_parent?: string;
  profession_parent?: string;
  
  // Documents
  documents?: File[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface UserFormErrors {
  [key: string]: string[];
}

// ===== CONSTANTES ET ÉNUMÉRATIONS =====

export const USER_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'administrateur', label: 'Administrateur', color: 'red' },
  { value: 'enseignant', label: 'Enseignant', color: 'blue' },
  { value: 'eleve', label: 'Élève', color: 'green' }
];

export const DOCUMENT_TYPES: { value: DocumentType; label: string; required: boolean }[] = [
  { value: 'photo_identite', label: 'Photo d\'identité', required: true },
  { value: 'acte_naissance', label: 'Acte de naissance', required: true },
  { value: 'certificat_scolarite', label: 'Certificat de scolarité', required: false },
  { value: 'diplome', label: 'Diplôme', required: false },
  { value: 'cv', label: 'CV', required: false },
  { value: 'autorisation_parentale', label: 'Autorisation parentale', required: true },
  { value: 'certificat_medical', label: 'Certificat médical', required: false },
  { value: 'justificatif_domicile', label: 'Justificatif de domicile', required: false }
];

export const USER_STATUS = {
  ACTIVE: { value: true, label: 'Actif', color: 'green' },
  INACTIVE: { value: false, label: 'Inactif', color: 'red' }
} as const;

// ===== TYPES DE PERMISSIONS =====

export enum UserPermission {
  CREATE_USER = 'user.create',
  READ_USER = 'user.read',
  UPDATE_USER = 'user.update',
  DELETE_USER = 'user.delete',
  MANAGE_USER_STATUS = 'user.manage_status',
  RESET_USER_PASSWORD = 'user.reset_password',
  VIEW_USER_STATS = 'user.view_stats',
  EXPORT_USERS = 'user.export',
  IMPORT_USERS = 'user.import'
}