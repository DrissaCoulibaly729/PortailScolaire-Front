// src/app/shared/models/api-response.model.ts

/**
 * Structure standard de réponse API Laravel
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationErrors;
  meta?: ResponseMeta;
  links?: PaginationLinks;
  status?: number;
  timestamp?: string;
}

/**
 * Réponse paginée standard
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

/**
 * Métadonnées de pagination
 */
export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

/**
 * Liens de pagination
 */
export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

/**
 * Métadonnées de réponse générique
 */
export interface ResponseMeta {
  request_id?: string;
  execution_time?: number;
  version?: string;
  [key: string]: any;
}

/**
 * Erreurs de validation
 */
export interface ValidationErrors {
  [field: string]: string[];
}

/**
 * Structure d'erreur API
 */
export interface ApiError {
  message: string;
  code?: string;
  type?: 'validation' | 'authorization' | 'not_found' | 'server_error';
  errors?: ValidationErrors;
  details?: any;
}

/**
 * Options pour les requêtes API
 */
export interface ApiRequestOptions {
  headers?: { [key: string]: string };
  params?: { [key: string]: any };
  timeout?: number;
  retries?: number;
}

/**
 * Réponse de création d'entité
 */
export interface CreateResponse<T = any> extends ApiResponse<T> {
  created_id?: number;
  created_at?: string;
}

/**
 * Réponse de mise à jour d'entité
 */
export interface UpdateResponse<T = any> extends ApiResponse<T> {
  updated_at?: string;
  changes?: string[];
}

/**
 * Réponse de suppression d'entité
 */
export interface DeleteResponse extends ApiResponse<void> {
  deleted_at?: string;
  deleted_id?: number;
}

/**
 * Réponse de téléchargement/export
 */
export interface ExportResponse {
  filename: string;
  url: string;
  size: number;
  format: 'csv' | 'xlsx' | 'pdf';
  expires_at?: string;
}

/**
 * Réponse d'import/upload
 */
export interface ImportResponse {
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  errors?: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
  }>;
  warnings?: string[];
}

/**
 * Réponse de recherche
 */
export interface SearchResponse<T = any> {
  results: T[];
  total_found: number;
  search_time: number;
  query: string;
  filters_applied?: string[];
  suggestions?: string[];
}

/**
 * Utilitaires pour les réponses API
 */
export class ApiResponseUtils {
  /**
   * Vérifier si la réponse est un succès
   */
  static isSuccess(response: ApiResponse): boolean {
    return response.success === true;
  }

  /**
   * Extraire les données de la réponse
   */
  static getData<T>(response: ApiResponse<T>): T | null {
    return this.isSuccess(response) ? response.data || null : null;
  }

  /**
   * Extraire le message d'erreur
   */
  static getErrorMessage(response: ApiResponse): string {
    if (this.isSuccess(response)) {
      return '';
    }
    
    if (response.errors) {
      // Combiner toutes les erreurs de validation
      const allErrors = Object.values(response.errors).flat();
      return allErrors.join(', ');
    }
    
    return response.message || 'Une erreur est survenue';
  }

  /**
   * Extraire les erreurs de validation par champ
   */
  static getValidationErrors(response: ApiResponse): ValidationErrors {
    return response.errors || {};
  }

  /**
   * Créer une réponse de succès
   */
  static createSuccessResponse<T>(data: T, message: string = 'Opération réussie'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Créer une réponse d'erreur
   */
  static createErrorResponse(message: string, errors?: ValidationErrors): ApiResponse {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Transformer une réponse paginée en tableau simple
   */
  static extractPaginatedData<T>(response: PaginatedResponse<T>): T[] {
    return response.data || [];
  }

  /**
   * Obtenir les informations de pagination
   */
  static getPaginationInfo(response: PaginatedResponse): {
    page: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const meta = response.meta;
    return {
      page: meta.current_page,
      totalPages: meta.last_page,
      total: meta.total,
      hasNext: meta.current_page < meta.last_page,
      hasPrev: meta.current_page > 1
    };
  }
}

/**
 * Types pour les réponses spécifiques
 */
export type UserResponse = ApiResponse<import('./user.model').User>;
export type UsersResponse = PaginatedResponse<import('./user.model').User>;

export type NoteResponse = ApiResponse<import('./note.model').Note>;
export type NotesResponse = PaginatedResponse<import('./note.model').Note>;

export type ClasseResponse = ApiResponse<import('./classe.model').Classe>;
export type ClassesResponse = PaginatedResponse<import('./classe.model').Classe>;

export type MatiereResponse = ApiResponse<import('./matiere.model').Matiere>;
export type MatieresResponse = PaginatedResponse<import('./matiere.model').Matiere>;