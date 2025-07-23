// ===== src/app/shared/models/auth.model.ts (MISE À JOUR) =====
export interface LoginRequest {
  login: string;
  mot_de_passe: string;
}

// Nouvelle interface qui correspond à votre API
export interface LoginApiResponse {
  message: string;
  statut: 'succes' | 'erreur';
  utilisateur: User;
  token: string;
  type_token: string;
}

// Interface pour usage interne (après transformation)
export interface LoginResponse {
  token: string;
  user: User;
  expires_at?: string;
  message?: string;
}

export interface ChangePasswordRequest {
  ancien_mot_de_passe: string;
  nouveau_mot_de_passe: string;
  nouveau_mot_de_passe_confirmation: string;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  date_naissance?: string;
  adresse?: string;
  role: 'administrateur' | 'enseignant' | 'eleve';
  actif: boolean;
  identifiant_genere?: string;
  created_at?: string;
  updated_at?: string;
}