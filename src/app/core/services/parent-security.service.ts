// src/app/core/services/parent-security.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ApiService } from './api.service';
import { Eleve, User } from '../../shared/models/user.model';
import { Bulletin } from '../../shared/models/bulletin.model';
import { Note } from '../../shared/models/note.model';

export interface ParentAccess {
  parent: User;
  enfants: Eleve[];
  permissions: string[];
}

export interface SecureDataResponse<T> {
  data: T;
  allowed: boolean;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParentSecurityService {

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  /**
   * 👨‍👩‍👧‍👦 Obtenir les enfants d'un parent authentifié
   */
  getEnfantsParent(): Observable<Eleve[]> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'eleve') {
      return throwError(() => new Error('Accès non autorisé: utilisateur non authentifié ou mauvais rôle'));
    }

    // Pour les comptes élève/parent, l'utilisateur connecté EST l'élève
    // ou le parent a les mêmes identifiants que l'élève
    return this.apiService.get<Eleve[]>(`/parent/enfants`).pipe(
      map(response => {
        // Vérifier que les données correspondent bien au parent connecté
        return this.filtrerDonneesParent(response);
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des enfants:', error);
        return throwError(() => new Error('Impossible de récupérer les informations des enfants'));
      })
    );
  }

  /**
   * 📊 Obtenir les bulletins d'un élève (avec vérification parentale)
   * ✅ CORRIGÉ: Utilisation de switchMap pour aplatir les observables
   */
  getBulletinsEleve(eleveId: number): Observable<SecureDataResponse<Bulletin[]>> {
    return this.verifierAccesEleve(eleveId).pipe(
      switchMap(acces => {
        if (!acces.allowed) {
          return of({
            data: [],
            allowed: false,
            reason: acces.reason
          });
        }

        // Si accès autorisé, récupérer les bulletins
        return this.apiService.get<Bulletin[]>(`/eleve/${eleveId}/bulletins`).pipe(
          map(bulletins => ({
            data: bulletins,
            allowed: true
          })),
          catchError(error => {
            console.error('Erreur récupération bulletins:', error);
            return of({
              data: [],
              allowed: false,
              reason: 'Erreur lors de la récupération des bulletins'
            });
          })
        );
      })
    );
  }

  /**
   * 📝 Obtenir les notes d'un élève (avec vérification parentale)
   * ✅ CORRIGÉ: Utilisation de switchMap pour aplatir les observables
   */
  getNotesEleve(eleveId: number): Observable<SecureDataResponse<Note[]>> {
    return this.verifierAccesEleve(eleveId).pipe(
      switchMap(acces => {
        if (!acces.allowed) {
          return of({
            data: [],
            allowed: false,
            reason: acces.reason
          });
        }

        return this.apiService.get<Note[]>(`/eleve/${eleveId}/notes`).pipe(
          map(notes => ({
            data: notes,
            allowed: true
          })),
          catchError(error => {
            console.error('Erreur récupération notes:', error);
            return of({
              data: [],
              allowed: false,
              reason: 'Erreur lors de la récupération des notes'
            });
          })
        );
      })
    );
  }

  /**
   * 📄 Télécharger un bulletin (avec vérification parentale)
   * ✅ CORRIGÉ: Utilisation de switchMap et correction de l'appel API
   */
  telechargerBulletin(bulletinId: number, eleveId: number): Observable<SecureDataResponse<Blob>> {
    return this.verifierAccesEleve(eleveId).pipe(
      switchMap(acces => {
        if (!acces.allowed) {
          return of({
            data: new Blob(),
            allowed: false,
            reason: acces.reason
          });
        }

        // ✅ CORRIGÉ: Utilisation de 'download' au lieu de 'downloadFile'
        return this.apiService.download(`/bulletins/${bulletinId}/download`).pipe(
          map(blob => ({
            data: blob,
            allowed: true
          })),
          catchError(error => {
            console.error('Erreur téléchargement bulletin:', error);
            return of({
              data: new Blob(),
              allowed: false,
              reason: 'Erreur lors du téléchargement du bulletin'
            });
          })
        );
      })
    );
  }

  /**
   * 🔍 Vérifier si un parent a accès aux données d'un élève
   */
  verifierAccesEleve(eleveId: number): Observable<{ allowed: boolean; reason?: string }> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return of({
        allowed: false,
        reason: 'Utilisateur non authentifié'
      });
    }

    if (currentUser.role !== 'eleve') {
      return of({
        allowed: false,
        reason: 'Accès réservé aux comptes élève/parent'
      });
    }

    // Récupérer les enfants du parent connecté
    return this.getEnfantsParent().pipe(
      map(enfants => {
        const eleveAutorise = enfants.find(enfant => enfant.id === eleveId);
        
        if (!eleveAutorise) {
          return {
            allowed: false,
            reason: 'Accès non autorisé à cet élève'
          };
        }

        return {
          allowed: true
        };
      }),
      catchError(error => {
        console.error('Erreur lors de la vérification d\'accès:', error);
        return of({
          allowed: false,
          reason: 'Erreur lors de la vérification des permissions'
        });
      })
    );
  }

  /**
   * 👪 Obtenir les informations d'accès du parent
   */
  getAccesParent(): Observable<ParentAccess> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'eleve') {
      return throwError(() => new Error('Accès non autorisé'));
    }

    return this.getEnfantsParent().pipe(
      map(enfants => ({
        parent: {
          ...currentUser,
          created_at: currentUser.created_at || new Date().toISOString(),
          updated_at: currentUser.updated_at || new Date().toISOString()
        } as User,
        enfants: enfants,
        permissions: this.getPermissionsParent()
      }))
    );
  }

  /**
   * 📋 Obtenir les permissions d'un parent
   */
  private getPermissionsParent(): string[] {
    return [
      'bulletins.read',        // Consulter les bulletins
      'bulletins.download',    // Télécharger les bulletins
      'notes.read',           // Consulter les notes
      'eleve.info.read',      // Consulter les infos élève
      'absences.read',        // Consulter les absences
      'emploi-temps.read'     // Consulter l'emploi du temps
    ];
  }

  /**
   * 🛡️ Filtrer les données selon les droits du parent
   */
  private filtrerDonneesParent<T>(donnees: T): T {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'eleve') {
      // Si pas de droits, retourner des données vides
      return (Array.isArray(donnees) ? [] : {}) as T;
    }

    // Ici, on pourrait ajouter une logique plus complexe
    // pour filtrer les données selon l'utilisateur connecté
    return donnees;
  }

  /**
   * 🔐 Middleware de sécurité pour les routes
   */
  checkParentAccess(eleveId?: number): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'eleve') {
      return of(false);
    }

    if (!eleveId) {
      // Si pas d'élève spécifique, vérifier juste l'authentification
      return of(true);
    }

    return this.verifierAccesEleve(eleveId).pipe(
      map(acces => acces.allowed)
    );
  }

  /**
   * 📱 Obtenir le tableau de bord sécurisé pour un parent
   */
  getDashboardParent(): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'eleve') {
      return throwError(() => new Error('Accès non autorisé'));
    }

    return this.getEnfantsParent().pipe(
      map(enfants => {
        // Créer un dashboard avec seulement les données autorisées
        return {
          parent: {
            nom: currentUser.nom,
            prenom: currentUser.prenom,
            email: currentUser.email,
            id: currentUser.id,
            role: currentUser.role
          },
          enfants: enfants.map(enfant => ({
            id: enfant.id,
            nom: enfant.nom,
            prenom: enfant.prenom,
            classe: enfant.classe?.nom,
            moyenne_generale: enfant.moyenne_generale,
            rang_classe: enfant.rang_classe,
            numero_etudiant: enfant.numero_etudiant,
            // Ajouter les informations parent nécessaires
            nom_parent: enfant.nom_parent,
            prenom_parent: enfant.prenom_parent,
            email_parent: enfant.email_parent,
            telephone_parent: enfant.telephone_parent
          })),
          derniers_bulletins: [], // À charger séparément avec sécurité
          notifications: [],      // Notifications spécifiques au parent
          permissions: this.getPermissionsParent()
        };
      }),
      catchError(error => {
        console.error('Erreur getDashboardParent:', error);
        return throwError(() => new Error('Impossible de charger le tableau de bord'));
      })
    );
  }

  /**
   * 🚨 Logger les tentatives d'accès non autorisées
   */
  private logAccesNonAutorise(action: string, eleveId?: number): void {
    const currentUser = this.authService.getCurrentUser();
    
    console.warn('Tentative d\'accès non autorisée:', {
      user: currentUser?.email || 'non authentifié',
      action,
      eleveId,
      timestamp: new Date().toISOString()
    });

    // Dans une vraie application, on enverrait ceci à un service de logging
    // ou à un système de monitoring de sécurité
  }

  /**
   * 🔄 Rafraîchir les permissions du parent
   */
  refreshPermissions(): Observable<string[]> {
    // Dans une vraie application, on récupérerait les permissions depuis le serveur
    return of(this.getPermissionsParent());
  }

  /**
   * 🎯 Vérifier une permission spécifique
   */
  hasPermission(permission: string): boolean {
    const permissions = this.getPermissionsParent();
    return permissions.includes(permission);
  }

  /**
   * 📞 Obtenir les informations de contact d'urgence
   */
  getContactsUrgence(eleveId: number): Observable<SecureDataResponse<any>> {
    return this.verifierAccesEleve(eleveId).pipe(
      map(acces => {
        if (!acces.allowed) {
          return {
            data: null,
            allowed: false,
            reason: acces.reason
          };
        }

        // Retourner seulement les contacts autorisés
        return {
          data: {
            // Les parents ne voient que leurs propres contacts
            parent_principal: true,
            telephone_urgence: true,
            email_urgence: true
          },
          allowed: true
        };
      })
    );
  }

  /**
   * 📧 Obtenir l'email du parent pour un élève (avec vérification)
   */
  getEmailParent(eleveId: number): Observable<SecureDataResponse<string>> {
    return this.verifierAccesEleve(eleveId).pipe(
      switchMap(acces => {
        if (!acces.allowed) {
          return of({
            data: '',
            allowed: false,
            reason: acces.reason
          });
        }

        return this.getEnfantsParent().pipe(
          map(enfants => {
            const eleve = enfants.find(e => e.id === eleveId);
            return {
              data: eleve?.email_parent || '',
              allowed: true
            };
          })
        );
      })
    );
  }

  /**
   * 🔒 Vérifier l'accès aux données sensibles
   */
  verifierAccesDonneesSensibles(eleveId: number, typeDonnees: string): Observable<boolean> {
    return this.verifierAccesEleve(eleveId).pipe(
      map(acces => {
        if (!acces.allowed) {
          this.logAccesNonAutorise(`accès ${typeDonnees}`, eleveId);
          return false;
        }

        return this.hasPermission(`${typeDonnees}.read`);
      })
    );
  }

  /**
   * 📊 Obtenir un résumé sécurisé d'un élève
   */
  getResumeSécuriséEleve(eleveId: number): Observable<SecureDataResponse<any>> {
    return this.verifierAccesEleve(eleveId).pipe(
      switchMap(acces => {
        if (!acces.allowed) {
          return of({
            data: null,
            allowed: false,
            reason: acces.reason
          });
        }

        return this.getEnfantsParent().pipe(
          map(enfants => {
            const eleve = enfants.find(e => e.id === eleveId);
            if (!eleve) {
              return {
                data: null,
                allowed: false,
                reason: 'Élève non trouvé'
              };
            }

            return {
              data: {
                id: eleve.id,
                nom: eleve.nom,
                prenom: eleve.prenom,
                classe: eleve.classe?.nom,
                numero_etudiant: eleve.numero_etudiant,
                moyenne_generale: eleve.moyenne_generale,
                rang_classe: eleve.rang_classe
              },
              allowed: true
            };
          })
        );
      })
    );
  }
}