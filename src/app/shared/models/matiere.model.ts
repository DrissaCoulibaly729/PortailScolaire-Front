import { Enseignant } from "./user.model";

// ===== src/app/shared/models/matiere.model.ts =====
export interface Matiere {
  id: number;
  nom: string;
  code: string;
  coefficient: number;
  description?: string;
  actif: boolean;
  enseignants?: Enseignant[];
  notes_count?: number;
  moyenne_generale?: number;
  created_at: string;
  updated_at: string;
}