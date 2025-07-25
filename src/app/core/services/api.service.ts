import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { APP_CONSTANTS } from '../constants/app-constants';
import { ApiResponse } from '../../shared/models/api-response.model';

interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  skipApiResponseWrapper?: boolean;
  skipErrorHandling?: boolean;
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
    if (options?.skipApiResponseWrapper) {
      return this.http.get<T>(`${this.baseUrl}${endpoint}`, options)
        .pipe(
          catchError(error => this.handleError(error))
        );
    }

    return this.http.get<any>(`${this.baseUrl}${endpoint}`, options)
      .pipe(
        map((response: any) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Effectue une requête POST
   */
  post<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    if (options?.skipApiResponseWrapper) {
      return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, options)
        .pipe(
          catchError(error => this.handleError(error))
        );
    }

    return this.http.post<any>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        map((response: any) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Effectue une requête PUT
   */
  put<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    if (options?.skipApiResponseWrapper) {
      return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, options)
        .pipe(
          catchError(error => this.handleError(error))
        );
    }

    return this.http.put<any>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        map((response: any) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Effectue une requête PATCH
   */
  patch<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    if (options?.skipApiResponseWrapper) {
      return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, options)
        .pipe(
          catchError(error => this.handleError(error))
        );
    }

    return this.http.patch<any>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        map((response: any) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Effectue une requête DELETE
   */
  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    if (options?.skipApiResponseWrapper) {
      return this.http.delete<T>(`${this.baseUrl}${endpoint}`, options)
        .pipe(
          catchError(error => this.handleError(error))
        );
    }

    return this.http.delete<any>(`${this.baseUrl}${endpoint}`, options)
      .pipe(
        map((response: any) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Upload de fichier
   */
  upload<T>(endpoint: string, file: File, additionalData?: any, options?: RequestOptions): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    if (options?.skipApiResponseWrapper) {
      return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData, options)
        .pipe(
          catchError(error => this.handleError(error))
        );
    }

    return this.http.post<any>(`${this.baseUrl}${endpoint}`, formData, options)
      .pipe(
        map((response: any) => this.extractData<T>(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Download de fichier
   */
  download(endpoint: string): Observable<Blob> {
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
   * 🔧 MÉTHODE MODIFIÉE - Extraire les données selon le format de votre API Laravel
   */
  private extractData<T>(response: any): T {
    console.log('🔍 ApiService - Réponse reçue:', response);
    
    // Vérifier le statut d'erreur
    if (response.statut === 'erreur') {
      throw new Error(response.message || 'Erreur API');
    }

    // 🎯 LOGIQUE ADAPTÉE À VOTRE API LARAVEL
    
    // Format pour les utilisateurs: { message, statut, utilisateurs: {...} }
    if (response.utilisateurs) {
      console.log('✅ Format utilisateurs détecté');
      return response as T;
    }
    
    // Format pour les classes: { message, statut, classes: {...} }
    if (response.classes) {
      console.log('✅ Format classes détecté');
      return response as T;
    }
    
    // Format pour les matières: { message, statut, matieres: {...} }
    if (response.matieres) {
      console.log('✅ Format matières détecté');
      return response as T;
    }
    
    // Format générique avec data: { message, statut, data: {...} }
    if (response.data !== undefined) {
      console.log('✅ Format data générique détecté');
      return response.data as T;
    }
    
    // Format pour un utilisateur unique: { message, statut, utilisateur: {...} }
    if (response.utilisateur) {
      console.log('✅ Format utilisateur unique détecté');
      return response.utilisateur as T;
    }
    
    // Format pour une classe unique: { message, statut, classe: {...} }
    if (response.classe) {
      console.log('✅ Format classe unique détecté');
      return response.classe as T;
    }
    
    // Format pour une matière unique: { message, statut, matiere: {...} }
    if (response.matiere) {
      console.log('✅ Format matière unique détecté');
      return response.matiere as T;
    }
    
    // Si c'est déjà dans le bon format (ex: liste simple)
    if (Array.isArray(response)) {
      console.log('✅ Format array direct détecté');
      return response as T;
    }
    
    // Fallback: retourner la réponse complète
    console.log('⚠️ Format non reconnu, retour de la réponse complète');
    return response as T;
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
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