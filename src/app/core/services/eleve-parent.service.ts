// ===== src/app/core/services/eleve-parent.service.ts (VERSION PRODUCTION) =====
import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import { ApiService } from './api.service';
import { AuthService } from '../auth/auth.service';
import { ParentSecurityService } from './parent-security.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

import { Bulletin, BulletinFilters } from '../../shared/models/bulletin.model';
import { Note, TypeEvaluation } from '../../shared/models/note.model';
import { Eleve, User } from '../../shared/models/user.model';
import { ApiResponse } from '../../shared/models/api-response.model';

// ✅ Interface avec data nullable - compatible avec vos modèles
export interface SecureDataResponse<T> {
  data: T | null;
  allowed: boolean;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EleveParentService {
  
  private currentEleveSubject = new BehaviorSubject<Eleve | null>(null);
  public currentEleve$ = this.currentEleveSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private parentSecurity: ParentSecurityService
  ) {}

  // ==================== GESTION ÉLÈVE ====================

  /**
   * 🚀 PRODUCTION: Obtenir les informations de l'élève connecté ou d'un enfant
   */
  getEleveDetails(eleveId?: number): Observable<SecureDataResponse<Eleve>> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return of({
        data: null,
        allowed: false,
        reason: 'Utilisateur non connecté'
      });
    }

    // Si pas d'eleveId fourni, utiliser l'utilisateur connecté
    const targetEleveId = eleveId || currentUser.id;

    if (!targetEleveId) {
      return of({
        data: null,
        allowed: false,
        reason: 'Identifiant élève manquant'
      });
    }

    // Vérification d'accès d'abord
    return this.parentSecurity.verifierAccesEleve(targetEleveId).pipe(
      switchMap(accessResult => {
        if (!accessResult.allowed) {
          return of({
            data: null,
            allowed: false,
            reason: accessResult.reason || 'Accès non autorisé'
          });
        }

        // 🚀 PRODUCTION: Appel API réel
        return this.apiService.get<Eleve>(API_ENDPOINTS.ELEVE.PROFIL.GET).pipe(
          map(eleve => {
            this.currentEleveSubject.next(eleve);
            return {
              data: eleve,
              allowed: true
            };
          }),
          catchError(error => {
            console.error('Erreur getEleveDetails:', error);
            return of({
              data: null,
              allowed: false,
              reason: 'Erreur lors du chargement des détails'
            });
          })
        );
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Mettre à jour les informations parent (téléphone, email, etc.)
   */
  updateInformationsParent(eleveId: number, updates: Partial<Eleve>): Observable<Eleve> {
    return this.parentSecurity.verifierAccesEleve(eleveId).pipe(
      switchMap(access => {
        if (!access.allowed) {
          return throwError(() => new Error(access.reason || 'Accès non autorisé'));
        }

        // 🚀 PRODUCTION: Préparer les données autorisées pour la mise à jour
        const allowedUpdates = {
          ...(updates.telephone_parent && { telephone_parent: updates.telephone_parent }),
          ...(updates.email_parent && { email_parent: updates.email_parent }),
          ...(updates.adresse && { adresse: updates.adresse }),
          ...(updates.telephone && { telephone: updates.telephone }),
          ...(updates.email && { email: updates.email })
        };

        return this.apiService.put<Eleve>(API_ENDPOINTS.ELEVE.PROFIL.UPDATE, allowedUpdates).pipe(
          tap(updatedEleve => {
            // Mettre à jour le cache local
            this.currentEleveSubject.next(updatedEleve);
          }),
          catchError(error => {
            console.error('Erreur updateInformationsParent:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  // ==================== GESTION BULLETINS ====================

  /**
   * 🚀 PRODUCTION: Alias pour getBulletinsEleve()
   */
  getBulletins(eleveId?: number, filters?: BulletinFilters): Observable<SecureDataResponse<Bulletin[]>> {
    return this.getBulletinsEleve(eleveId, filters);
  }

  /**
   * 🚀 PRODUCTION: Obtenir les bulletins d'un élève
   */
  getBulletinsEleve(eleveId?: number, filters?: BulletinFilters): Observable<SecureDataResponse<Bulletin[]>> {
    const currentUser = this.authService.getCurrentUser();
    const targetEleveId = eleveId || currentUser?.id;

    if (!targetEleveId) {
      return of({
        data: null,
        allowed: false,
        reason: 'Identifiant élève manquant'
      });
    }

    return this.parentSecurity.verifierAccesEleve(targetEleveId).pipe(
      switchMap(access => {
        if (!access.allowed) {
          return of({
            data: null,
            allowed: false,
            reason: access.reason || 'Accès non autorisé'
          });
        }

        // 🚀 PRODUCTION: Appel API réel avec construction d'URL
        let endpoint = API_ENDPOINTS.ELEVE.BULLETINS.LIST;
        
        // Ajouter les paramètres de filtre si fournis
        const params = new URLSearchParams();
        if (filters?.periode_id) params.append('periode_id', filters.periode_id.toString());
        if (filters?.statut) params.append('statut', filters.statut);
        if (filters?.annee_scolaire) params.append('annee_scolaire', filters.annee_scolaire);
        
        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }

        return this.apiService.get<Bulletin[]>(endpoint).pipe(
          map(bulletins => ({
            data: bulletins,
            allowed: true
          })),
          catchError(error => {
            console.error('Erreur getBulletinsEleve:', error);
            return of({
              data: null,
              allowed: false,
              reason: 'Erreur lors du chargement des bulletins'
            });
          })
        );
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Obtenir un bulletin spécifique
   */
  getBulletinDetail(bulletinId: number): Observable<SecureDataResponse<Bulletin>> {
    return this.apiService.get<Bulletin>(API_ENDPOINTS.ELEVE.BULLETINS.BY_ID(bulletinId)).pipe(
      switchMap(bulletin => {
        return this.parentSecurity.verifierAccesEleve(bulletin.eleve_id).pipe(
          map(access => ({
            data: access.allowed ? bulletin : null,
            allowed: access.allowed,
            reason: access.reason
          }))
        );
      }),
      catchError(error => {
        console.error('Erreur getBulletinDetail:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Bulletin non trouvé'
        });
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Télécharger un bulletin PDF
   */
  downloadBulletinPdf(bulletinId: number): Observable<SecureDataResponse<Blob>> {
    return this.getBulletinDetail(bulletinId).pipe(
      switchMap(result => {
        if (!result.allowed || !result.data) {
          return of({
            data: null,
            allowed: false,
            reason: result.reason || 'Accès non autorisé'
          });
        }

        // 🚀 PRODUCTION: Téléchargement réel du PDF
        return this.downloadFile(API_ENDPOINTS.ELEVE.BULLETINS.TELECHARGER(bulletinId)).pipe(
          map(blob => ({
            data: blob,
            allowed: true
          })),
          catchError(error => {
            console.error('Erreur téléchargement PDF:', error);
            return of({
              data: null,
              allowed: false,
              reason: 'Erreur lors du téléchargement'
            });
          })
        );
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Obtenir l'historique des bulletins
   */
  getBulletinHistorique(annee?: number): Observable<SecureDataResponse<Bulletin[]>> {
    const endpoint = annee 
      ? API_ENDPOINTS.ELEVE.BULLETINS.HISTORIQUE(annee)
      : API_ENDPOINTS.ELEVE.BULLETINS.HISTORIQUE();

    return this.apiService.get<Bulletin[]>(endpoint).pipe(
      map(bulletins => ({
        data: bulletins,
        allowed: true
      })),
      catchError(error => {
        console.error('Erreur getBulletinHistorique:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Erreur lors du chargement de l\'historique'
        });
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Comparer avec la classe
   */
  getComparaisonClasse(bulletinId: number): Observable<SecureDataResponse<any>> {
    return this.apiService.get<any>(API_ENDPOINTS.ELEVE.BULLETINS.COMPARAISON_CLASSE(bulletinId)).pipe(
      map(comparaison => ({
        data: comparaison,
        allowed: true
      })),
      catchError(error => {
        console.error('Erreur getComparaisonClasse:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Erreur lors de la comparaison'
        });
      })
    );
  }

  // ==================== GESTION NOTES ====================

  /**
   * 🚀 PRODUCTION: Obtenir les notes d'un élève
   */
  getNotesEleve(eleveId?: number, matiereId?: number): Observable<SecureDataResponse<Note[]>> {
    const currentUser = this.authService.getCurrentUser();
    const targetEleveId = eleveId || currentUser?.id;

    if (!targetEleveId) {
      return of({
        data: null,
        allowed: false,
        reason: 'Identifiant élève manquant'
      });
    }

    return this.parentSecurity.verifierAccesEleve(targetEleveId).pipe(
      switchMap(access => {
        if (!access.allowed) {
          return of({
            data: null,
            allowed: false,
            reason: access.reason || 'Accès non autorisé'
          });
        }

        // 🚀 PRODUCTION: Choisir l'endpoint selon le filtre
        let endpoint: string;
        if (matiereId) {
          endpoint = API_ENDPOINTS.ELEVE.NOTES.MATIERE(matiereId);
        } else {
          endpoint = API_ENDPOINTS.ELEVE.NOTES.LIST;
        }

        return this.apiService.get<Note[]>(endpoint).pipe(
          map(notes => ({
            data: notes,
            allowed: true
          })),
          catchError(error => {
            console.error('Erreur getNotesEleve:', error);
            return of({
              data: null,
              allowed: false,
              reason: 'Erreur lors du chargement des notes'
            });
          })
        );
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Obtenir les notes par période
   */
  getNotesPeriode(periode: string): Observable<SecureDataResponse<Note[]>> {
    return this.apiService.get<Note[]>(API_ENDPOINTS.ELEVE.NOTES.PERIODE(periode)).pipe(
      map(notes => ({
        data: notes,
        allowed: true
      })),
      catchError(error => {
        console.error('Erreur getNotesPeriode:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Erreur lors du chargement des notes'
        });
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Obtenir l'évolution des notes
   */
  getEvolutionNotes(): Observable<SecureDataResponse<any[]>> {
    return this.apiService.get<any[]>(API_ENDPOINTS.ELEVE.NOTES.EVOLUTION).pipe(
      map(evolution => ({
        data: evolution,
        allowed: true
      })),
      catchError(error => {
        console.error('Erreur getEvolutionNotes:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Erreur lors du chargement de l\'évolution'
        });
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Obtenir les moyennes par matière (calculées côté serveur)
   */
  getMoyennesParMatiere(eleveId?: number): Observable<SecureDataResponse<any[]>> {
    const currentUser = this.authService.getCurrentUser();
    const targetEleveId = eleveId || currentUser?.id;

    if (!targetEleveId) {
      return of({
        data: null,
        allowed: false,
        reason: 'Identifiant élève manquant'
      });
    }

    return this.parentSecurity.verifierAccesEleve(targetEleveId).pipe(
      switchMap(access => {
        if (!access.allowed) {
          return of({
            data: null,
            allowed: false,
            reason: access.reason || 'Accès non autorisé'
          });
        }

        // 🚀 PRODUCTION: Endpoint pour les moyennes calculées côté serveur
        return this.apiService.get<any[]>(`/eleve/moyennes-matieres`).pipe(
          map(moyennes => ({
            data: moyennes,
            allowed: true
          })),
          catchError(error => {
            console.error('Erreur getMoyennesParMatiere:', error);
            return of({
              data: null,
              allowed: false,
              reason: 'Erreur lors du chargement des moyennes'
            });
          })
        );
      })
    );
  }

  // ==================== GESTION PROFIL ====================

  /**
   * 🚀 PRODUCTION: Obtenir les informations de la classe
   */
  getMaClasse(): Observable<SecureDataResponse<any>> {
    return this.apiService.get<any>(API_ENDPOINTS.ELEVE.PROFIL.MA_CLASSE).pipe(
      map(classe => ({
        data: classe,
        allowed: true
      })),
      catchError(error => {
        console.error('Erreur getMaClasse:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Erreur lors du chargement de la classe'
        });
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Obtenir le parcours scolaire
   */
  getMonParcours(): Observable<SecureDataResponse<any[]>> {
    return this.apiService.get<any[]>(API_ENDPOINTS.ELEVE.PROFIL.MON_PARCOURS).pipe(
      map(parcours => ({
        data: parcours,
        allowed: true
      })),
      catchError(error => {
        console.error('Erreur getMonParcours:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Erreur lors du chargement du parcours'
        });
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Obtenir les préférences de notification
   */
  getPreferencesNotification(): Observable<SecureDataResponse<any>> {
    return this.apiService.get<any>(API_ENDPOINTS.ELEVE.PROFIL.PREFERENCES_NOTIFICATIONS).pipe(
      map(preferences => ({
        data: preferences,
        allowed: true
      })),
      catchError(error => {
        console.error('Erreur getPreferencesNotification:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Erreur lors du chargement des préférences'
        });
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Mettre à jour les préférences de notification
   */
  updatePreferencesNotification(preferences: any): Observable<any> {
    return this.apiService.put<any>(API_ENDPOINTS.ELEVE.PROFIL.UPDATE_PREFERENCES, preferences).pipe(
      catchError(error => {
        console.error('Erreur updatePreferencesNotification:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== GESTION DOCUMENTS ====================

  /**
   * 🚀 PRODUCTION: Obtenir la liste des documents
   */
  getDocuments(): Observable<SecureDataResponse<any[]>> {
    return this.apiService.get<any[]>(API_ENDPOINTS.ELEVE.DOCUMENTS.LIST).pipe(
      map(documents => ({
        data: documents,
        allowed: true
      })),
      catchError(error => {
        console.error('Erreur getDocuments:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Erreur lors du chargement des documents'
        });
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Obtenir le statut de validation des documents
   */
  getStatutValidationDocuments(): Observable<SecureDataResponse<any>> {
    return this.apiService.get<any>(API_ENDPOINTS.ELEVE.DOCUMENTS.STATUT_VALIDATION).pipe(
      map(statut => ({
        data: statut,
        allowed: true
      })),
      catchError(error => {
        console.error('Erreur getStatutValidationDocuments:', error);
        return of({
          data: null,
          allowed: false,
          reason: 'Erreur lors du chargement du statut'
        });
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Uploader un document
   */
  uploadDocument(file: File, metadata: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    return this.apiService.post<any>(API_ENDPOINTS.ELEVE.DOCUMENTS.UPLOAD, formData).pipe(
      catchError(error => {
        console.error('Erreur uploadDocument:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 🚀 PRODUCTION: Supprimer un document
   */
  deleteDocument(documentId: number): Observable<void> {
    return this.apiService.delete<void>(API_ENDPOINTS.ELEVE.DOCUMENTS.DELETE(documentId)).pipe(
      catchError(error => {
        console.error('Erreur deleteDocument:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== UTILITAIRES ====================

  /**
   * 🚀 PRODUCTION: Méthode pour télécharger des fichiers
   */
  private downloadFile(url: string): Observable<Blob> {
    return new Observable<Blob>(observer => {
      const token = this.authService.getToken();
      
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        observer.next(blob);
        observer.complete();
      })
      .catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Vérifier si l'utilisateur peut modifier les données
   */
  canModifyData(eleveId: number): Observable<boolean> {
    return this.parentSecurity.verifierAccesEleve(eleveId).pipe(
      map(access => access.allowed)
    );
  }

  /**
   * Obtenir l'élève actuellement sélectionné
   */
  getCurrentEleve(): Eleve | null {
    return this.currentEleveSubject.value;
  }

  /**
   * Nettoyer les données en cache
   */
  clearCache(): void {
    this.currentEleveSubject.next(null);
  }

  /**
   * 🚀 PRODUCTION: Télécharger un fichier avec gestion des erreurs
   */
  downloadFileSecure(url: string, filename?: string): void {
    this.downloadFile(url).subscribe({
      next: (blob) => {
        // Créer un URL temporaire pour le téléchargement
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'document.pdf';
        
        // Déclencher le téléchargement
        document.body.appendChild(link);
        link.click();
        
        // Nettoyer
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (error) => {
        console.error('Erreur téléchargement:', error);
        // Vous pouvez ajouter une notification d'erreur ici
      }
    });
  }

  /**
   * 🚀 PRODUCTION: Méthode utilitaire pour construire des URLs avec paramètres
   */
  private buildUrlWithParams(baseUrl: string, params: Record<string, any>): string {
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
    return url.pathname + url.search;
  }

  /**
   * 🚀 PRODUCTION: Gestion centralisée des erreurs
   */
  private handleError(operation: string) {
    return (error: any): Observable<SecureDataResponse<any>> => {
      console.error(`Erreur ${operation}:`, error);
      
      let errorMessage = 'Une erreur inattendue s\'est produite';
      
      if (error.status === 401) {
        errorMessage = 'Session expirée, veuillez vous reconnecter';
      } else if (error.status === 403) {
        errorMessage = 'Accès non autorisé';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée';
      } else if (error.status === 500) {
        errorMessage = 'Erreur du serveur, veuillez réessayer plus tard';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      return of({
        data: null,
        allowed: false,
        reason: errorMessage
      });
    };
  }
}