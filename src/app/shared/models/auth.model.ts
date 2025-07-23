export interface LoginRequest {
  login: string;
  mot_de_passe: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expires_at: string;
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
  created_at: string;
  updated_at: string;
}