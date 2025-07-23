// ===== src/app/core/services/api.service.ts (VERSION CORRIGÉE) =====
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { APP_CONSTANTS } from '../constants/app-constants';
import { ApiResponse } from '../../shared/models/api-response.model';

export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  observe?: 'body' | 'response';
  responseType?: 'json' | 'blob' | 'text';
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = APP_CONSTANTS.API.BASE_URL;

  constructor(private http: HttpClient) {}

  /**
   * Effectue une requête GET
   */
  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, options)
      .pipe(
        map((response: ApiResponse<T>) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Effectue une requête POST
   */
  post<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        map((response: ApiResponse<T>) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Effectue une requête PUT
   */
  put<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        map((response: ApiResponse<T>) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Effectue une requête PATCH
   */
  patch<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        map((response: ApiResponse<T>) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Effectue une requête DELETE
   */
  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, options)
      .pipe(
        map((response: ApiResponse<T>) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Upload de fichier
   */
  upload<T>(endpoint: string, file: File, additionalData?: any): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, formData)
      .pipe(
        map((response: ApiResponse<T>) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Download de fichier
   */
  download(endpoint: string, filename?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Construire des paramètres de requête
   */
  buildHttpParams(params: { [key: string]: any }): HttpParams {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => {
            httpParams = httpParams.append(key, item.toString());
          });
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });
    
    return httpParams;
  }

  /**
   * Extraire les données de la réponse API (VERSION TYPÉE)
   */
  private extractData<T>(response: ApiResponse<T>): T {
    if (response.statut === 'erreur') {
      throw new Error(response.message || 'Erreur API');
    }
    return response.data as T;
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = 'Requête invalide';
          break;
        case 401:
          errorMessage = 'Non authentifié';
          break;
        case 403:
          errorMessage = 'Accès refusé';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 422:
          errorMessage = 'Données de validation invalides';
          break;
        case 500:
          errorMessage = 'Erreur serveur interne';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
      
      // Si l'API retourne un message d'erreur spécifique
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    console.error('Erreur API:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Construire l'URL complète
   */
  getFullUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  /**
   * Vérifier le statut de l'API
   */
  checkApiHealth(): Observable<any> {
    return this.get<any>('/health');
  }
}