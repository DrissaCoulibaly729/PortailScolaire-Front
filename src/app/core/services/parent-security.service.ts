// src/app/core/services/parent-security.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ApiService } from './api.service';
import { Eleve, User } from '../../shared/models/user.model';
import { Bulletin } from '../../shared/models/bulletin.model';
import { Note, TypeEvaluation } from '../../shared/models/note.model';

export interface ParentAccess {
  parent: User;
  enfants: Eleve[];
  permissions: string[];
}

export interface AccessVerificationResult {
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

    // ✅ TEMPORAIRE: Retourner données de test au lieu d'appel API
    return of(this.getMockEnfants());

    // ✅ PRODUCTION: Décommenter ces lignes
    // return this.apiService.get<Eleve[]>(`/parent/enfants`).pipe(
    //   map(response => {
    //     return this.filtrerDonneesParent(response);
    //   }),
    //   catchError(error => {
    //     console.error('Erreur lors de la récupération des enfants:', error);
    //     return of(this.getMockEnfants());
    //   })
    // );
  }

  /**
   * 🔐 Vérifier l'accès à un élève spécifique
   */
  verifierAccesEleve(eleveId: number): Observable<AccessVerificationResult> {
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

    // Vérifier si l'utilisateur connecté correspond à l'élève demandé
    // ou si c'est un parent ayant accès à cet élève
    return this.getEnfantsParent().pipe(
      map(enfants => {
        const eleveAutorise = enfants.find(enfant => enfant.id === eleveId);
        
        if (!eleveAutorise && currentUser.id !== eleveId) {
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
   * 📊 Obtenir les bulletins d'un élève (avec vérification parentale)
   */
  getBulletinsEleve(eleveId: number): Observable<{ allowed: boolean; data: Bulletin[] | null; reason?: string }> {
    return this.verifierAccesEleve(eleveId).pipe(
      switchMap(access => {
        if (!access.allowed) {
          return of({
            allowed: false,
            data: null,
            reason: access.reason
          });
        }

        // ✅ TEMPORAIRE: Retourner données de test
        return of({
          allowed: true,
          data: this.filtrerDonneesParent(this.getMockBulletins())
        });

        // ✅ PRODUCTION: Décommenter ces lignes
        // return this.apiService.get<Bulletin[]>(`/eleves/${eleveId}/bulletins`).pipe(
        //   map(bulletins => ({
        //     allowed: true,
        //     data: this.filtrerDonneesParent(bulletins)
        //   })),
        //   catchError(error => {
        //     console.error('Erreur getBulletinsEleve:', error);
        //     return of({
        //       allowed: false,
        //       data: null,
        //       reason: 'Erreur lors du chargement des bulletins'
        //     });
        //   })
        // );
      })
    );
  }

  /**
   * 📝 Obtenir les notes d'un élève (avec vérification parentale)
   */
  getNotesEleve(eleveId: number): Observable<{ allowed: boolean; data: Note[] | null; reason?: string }> {
    return this.verifierAccesEleve(eleveId).pipe(
      switchMap(access => {
        if (!access.allowed) {
          return of({
            allowed: false,
            data: null,
            reason: access.reason
          });
        }

        // ✅ TEMPORAIRE: Retourner données de test
        return of({
          allowed: true,
          data: this.filtrerDonneesParent(this.getMockNotes())
        });

        // ✅ PRODUCTION: Décommenter ces lignes
        // return this.apiService.get<Note[]>(`/eleves/${eleveId}/notes`).pipe(
        //   map(notes => ({
        //     allowed: true,
        //     data: this.filtrerDonneesParent(notes)
        //   })),
        //   catchError(error => {
        //     console.error('Erreur getNotesEleve:', error);
        //     return of({
        //       allowed: false,
        //       data: null,
        //       reason: 'Erreur lors du chargement des notes'
        //     });
        //   })
        // );
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
   * 📊 Obtenir un résumé sécurisé d'un élève
   */
  getResumeSécuriséEleve(eleveId: number): Observable<{ allowed: boolean; data: any | null; reason?: string }> {
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
    console.warn(`Tentative d'accès non autorisée:`, {
      action,
      eleveId,
      utilisateur: currentUser?.id,
      role: currentUser?.role,
      timestamp: new Date().toISOString()
    });
  }

  // ==================== DONNÉES DE TEST (TEMPORAIRES) ====================

  /**
   * ✅ CORRIGÉ: Données de test pour les enfants - Classe complète
   */
  private getMockEnfants(): Eleve[] {
    const currentUser = this.authService.getCurrentUser();
    
    return [
      {
        id: currentUser?.id || 1,
        nom: currentUser?.nom || 'Dupont',
        prenom: currentUser?.prenom || 'Pierre',
        email: currentUser?.email || 'pierre.dupont@eleve.fr',
        telephone: '0123456789',
        date_naissance: '2008-05-15',
        adresse: '123 Rue de la Paix, 75001 Paris',
        numero_etudiant: 'E2024001',
        role: 'eleve',
        actif: true, // ✅ AJOUTÉ: Propriété requise
        
        // Informations scolaires
        classe_id: 1,
        moyenne_generale: 14.5,
        rang_classe: 8,
        
        // Informations parent
        nom_parent: 'Dupont',
        prenom_parent: 'Marie',
        email_parent: 'marie.dupont@parent.fr',
        telephone_parent: '0678901234',
        
        // ✅ CORRIGÉ: Relations - Classe complète avec toutes les propriétés requises
        classe: {
          id: 1,
          nom: '3ème A',
          niveau: '3ème',
          section: 'A',              // ✅ AJOUTÉ: Propriété manquante
          effectif_max: 30,
          effectif_actuel: 25,       // ✅ AJOUTÉ: Propriété optionnelle mais recommandée
          actif: true,               // ✅ AJOUTÉ: Propriété manquante
          moyenne: 13.2,             // ✅ AJOUTÉ: Propriété manquante
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z'
        },
        
        // Métadonnées
        created_at: '2024-09-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z'
      }
    ];
  }

  /**
   * ✅ Données de test pour les bulletins - Compatible avec votre modèle
   */
  private getMockBulletins(): Bulletin[] {
    return [
      {
        id: 1,
        eleve_id: 1,
        classe_id: 1,
        periode_id: 1,
        annee_scolaire: '2024-2025',
        moyenne_generale: 14.5,
        rang_classe: 8,
        total_eleves: 25,
        mention: 'Bien',
        statut: 'publie',
        observations_generales: 'Bon trimestre, continuez vos efforts',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        periode: {
          id: 1,
          nom: 'Trimestre 1',
          type: 'trimestre1',
          date_debut: '2024-09-01',
          date_fin: '2024-12-20',
          actif: true,
          annee_scolaire: '2024-2025',
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z'
        }
      }
    ];
  }

  /**
   * ✅ Données de test pour les notes - Compatible avec votre modèle Note
   */
  private getMockNotes(): Note[] {
    return [
      {
        id: 1,
        eleve_id: 1,
        matiere_id: 1,
        enseignant_id: 1,
        classe_id: 1,
        valeur: 16,
        type: 'devoir' as TypeEvaluation,
        type_evaluation: 'devoir' as TypeEvaluation,
        periode: 'trimestre1',
        coefficient: 1,
        date_evaluation: '2024-11-15',
        commentaire: 'Très bon travail',
        created_at: '2024-11-15T10:00:00Z',
        updated_at: '2024-11-15T10:00:00Z',
        matiere: {
          id: 1,
          nom: 'Mathématiques',
          code: 'MATH',
          coefficient: 4,
          actif: true,
          active: true, // ✅ Propriété requise pour votre modèle Matiere
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z'
        }
      },
      {
        id: 2,
        eleve_id: 1,
        matiere_id: 2,
        enseignant_id: 2,
        classe_id: 1,
        valeur: 14,
        type: 'controle' as TypeEvaluation,
        type_evaluation: 'controle' as TypeEvaluation,
        periode: 'trimestre1',
        coefficient: 1,
        date_evaluation: '2024-11-20',
        commentaire: 'Bon niveau, quelques erreurs d\'inattention',
        created_at: '2024-11-20T10:00:00Z',
        updated_at: '2024-11-20T10:00:00Z',
        matiere: {
          id: 2,
          nom: 'Français',
          code: 'FR',
          coefficient: 4,
          actif: true,
          active: true, // ✅ Propriété requise pour votre modèle Matiere
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z'
        }
      }
    ];
  }
}