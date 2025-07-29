// src/app/core/services/eleve-parent.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import { ApiService } from './api.service';
import { AuthService } from '../auth/auth.service';
import { ParentSecurityService } from './parent-security.service';

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
   * Obtenir les informations de l'élève connecté ou d'un enfant
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

        // ✅ TEMPORAIRE: Retourner données de test au lieu d'appel API
        return of({
          data: this.getMockEleve(targetEleveId),
          allowed: true
        });

        // ✅ PRODUCTION: Décommenter cette ligne et supprimer le mock ci-dessus
        // return this.apiService.get<Eleve>(`/eleves/${targetEleveId}`).pipe(
        //   map(eleve => {
        //     this.currentEleveSubject.next(eleve);
        //     return {
        //       data: eleve,
        //       allowed: true
        //     };
        //   }),
        //   catchError(error => {
        //     console.error('Erreur getEleveDetails:', error);
        //     return of({
        //       data: null,
        //       allowed: false,
        //       reason: 'Erreur lors du chargement des détails'
        //     });
        //   })
        // );
      })
    );
  }

  /**
   * ✅ CORRIGÉ: Mettre à jour les informations parent (téléphone, email, etc.)
   */
  updateInformationsParent(eleveId: number, updates: Partial<Eleve>): Observable<Eleve> {
    return this.parentSecurity.verifierAccesEleve(eleveId).pipe(
      switchMap(access => {
        if (!access.allowed) {
          return throwError(() => new Error(access.reason || 'Accès non autorisé'));
        }

        // ✅ TEMPORAIRE: Simuler la mise à jour avec un objet Eleve complet
        const currentEleve = this.getMockEleve(eleveId);
        
        // Créer un nouvel objet Eleve avec les mises à jour appliquées
        const updatedEleve: Eleve = {
          ...currentEleve,
          // Appliquer uniquement les champs autorisés et définis
          ...(updates.telephone_parent && { telephone_parent: updates.telephone_parent }),
          ...(updates.email_parent && { email_parent: updates.email_parent }),
          ...(updates.adresse && { adresse: updates.adresse }),
          ...(updates.telephone && { telephone: updates.telephone }),
          ...(updates.email && { email: updates.email }),
          // Mise à jour du timestamp
          updated_at: new Date().toISOString()
        };

        return of(updatedEleve);

        // ✅ PRODUCTION: Décommenter ces lignes
        // const allowedUpdates = {
        //   ...(updates.telephone_parent && { telephone_parent: updates.telephone_parent }),
        //   ...(updates.email_parent && { email_parent: updates.email_parent }),
        //   ...(updates.adresse && { adresse: updates.adresse }),
        //   ...(updates.telephone && { telephone: updates.telephone }),
        //   ...(updates.email && { email: updates.email })
        // };
        // return this.apiService.put<Eleve>(`/eleves/${eleveId}/parent-info`, allowedUpdates);
      })
    );
  }

  // ==================== GESTION BULLETINS ====================

  /**
   * Obtenir les bulletins d'un élève
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

        // ✅ TEMPORAIRE: Retourner données de test
        let bulletins = this.getMockBulletins();
        
        // Appliquer les filtres si fournis
        if (filters) {
          bulletins = this.applyBulletinFilters(bulletins, filters);
        }

        return of({
          data: bulletins,
          allowed: true
        });

        // ✅ PRODUCTION: Décommenter ces lignes
        // return this.apiService.get<Bulletin[]>(`/eleves/${targetEleveId}/bulletins`).pipe(
        //   map(bulletins => {
        //     let filteredBulletins = bulletins;
        //     if (filters) {
        //       filteredBulletins = this.applyBulletinFilters(bulletins, filters);
        //     }
        //     return {
        //       data: filteredBulletins,
        //       allowed: true
        //     };
        //   }),
        //   catchError(error => {
        //     console.error('Erreur getBulletinsEleve:', error);
        //     return of({
        //       data: null,
        //       allowed: false,
        //       reason: 'Erreur lors du chargement des bulletins'
        //     });
        //   })
        // );
      })
    );
  }

  /**
   * Obtenir un bulletin spécifique
   */
  getBulletinDetail(bulletinId: number): Observable<SecureDataResponse<Bulletin>> {
    // ✅ TEMPORAIRE: Simuler la récupération du bulletin
    const mockBulletin = this.getMockBulletins().find(b => b.id === bulletinId);
    
    if (!mockBulletin) {
      return of({
        data: null,
        allowed: false,
        reason: 'Bulletin non trouvé'
      });
    }

    return this.parentSecurity.verifierAccesEleve(mockBulletin.eleve_id).pipe(
      map(access => ({
        data: access.allowed ? mockBulletin : null,
        allowed: access.allowed,
        reason: access.reason
      }))
    );

    // ✅ PRODUCTION: Décommenter ces lignes
    // return this.apiService.get<Bulletin>(`/bulletins/${bulletinId}`).pipe(
    //   switchMap(bulletin => {
    //     return this.parentSecurity.verifierAccesEleve(bulletin.eleve_id).pipe(
    //       map(access => ({
    //         data: access.allowed ? bulletin : null,
    //         allowed: access.allowed,
    //         reason: access.reason
    //       }))
    //     );
    //   }),
    //   catchError(error => {
    //     console.error('Erreur getBulletinDetail:', error);
    //     return of({
    //       data: null,
    //       allowed: false,
    //       reason: 'Bulletin non trouvé'
    //     });
    //   })
    // );
  }

  /**
   * Télécharger un bulletin PDF
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

        // ✅ TEMPORAIRE: Simuler un PDF vide
        const mockPdfBlob = new Blob(['Mock PDF content'], { type: 'application/pdf' });
        return of({
          data: mockPdfBlob,
          allowed: true
        });

        // ✅ PRODUCTION: Décommenter ces lignes
        // return this.downloadFile(`/bulletins/${bulletinId}/pdf`).pipe(
        //   map(blob => ({
        //     data: blob,
        //     allowed: true
        //   })),
        //   catchError(error => {
        //     console.error('Erreur téléchargement PDF:', error);
        //     return of({
        //       data: null,
        //       allowed: false,
        //       reason: 'Erreur lors du téléchargement'
        //     });
        //   })
        // );
      })
    );
  }

  /**
   * Méthode pour télécharger des fichiers (pour production)
   */
  private downloadFile(url: string): Observable<Blob> {
    return new Observable<Blob>(observer => {
      const token = this.authService.getToken();
      
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/pdf'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement');
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

  // ==================== GESTION NOTES ====================

  /**
   * Obtenir les notes d'un élève
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

        // ✅ TEMPORAIRE: Retourner données de test
        let notes = this.getMockNotes();
        
        // Filtrer par matière si demandé
        if (matiereId) {
          notes = notes.filter(note => note.matiere_id === matiereId);
        }

        return of({
          data: notes,
          allowed: true
        });

        // ✅ PRODUCTION: Décommenter ces lignes
        // let endpoint = `/eleves/${targetEleveId}/notes`;
        // if (matiereId) {
        //   endpoint += `?matiere_id=${matiereId}`;
        // }
        // 
        // return this.apiService.get<Note[]>(endpoint).pipe(
        //   map(notes => ({
        //     data: notes,
        //     allowed: true
        //   })),
        //   catchError(error => {
        //     console.error('Erreur getNotesEleve:', error);
        //     return of({
        //       data: null,
        //       allowed: false,
        //       reason: 'Erreur lors du chargement des notes'
        //     });
        //   })
        // );
      })
    );
  }

  /**
   * Obtenir les moyennes par matière
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

        // ✅ TEMPORAIRE: Calculer moyennes à partir des notes de test
        const notes = this.getMockNotes();
        const moyennesParMatiere = this.calculerMoyennesParMatiere(notes);

        return of({
          data: moyennesParMatiere,
          allowed: true
        });

        // ✅ PRODUCTION: Décommenter ces lignes
        // return this.apiService.get<any[]>(`/eleves/${targetEleveId}/moyennes-matieres`).pipe(
        //   map(moyennes => ({
        //     data: moyennes,
        //     allowed: true
        //   })),
        //   catchError(error => {
        //     console.error('Erreur getMoyennesParMatiere:', error);
        //     return of({
        //       data: null,
        //       allowed: false,
        //       reason: 'Erreur lors du chargement des moyennes'
        //     });
        //   })
        // );
      })
    );
  }

  // ==================== UTILITAIRES ====================

  /**
   * Appliquer des filtres aux bulletins
   */
  private applyBulletinFilters(bulletins: Bulletin[], filters: BulletinFilters): Bulletin[] {
    return bulletins.filter(bulletin => {
      if (filters.periode_id && bulletin.periode_id !== filters.periode_id) {
        return false;
      }
      if (filters.statut && bulletin.statut !== filters.statut) {
        return false;
      }
      if (filters.annee_scolaire && bulletin.annee_scolaire !== filters.annee_scolaire) {
        return false;
      }
      return true;
    });
  }

  /**
   * Calculer moyennes par matière à partir des notes
   */
  private calculerMoyennesParMatiere(notes: Note[]): any[] {
    const matiereMap = new Map<number, {
      matiere: any;
      notes: Note[];
      total: number;
      coefficient_total: number;
    }>();

    notes.forEach(note => {
      if (!note.matiere) return;

      const matiereId = note.matiere.id;
      if (!matiereMap.has(matiereId)) {
        matiereMap.set(matiereId, {
          matiere: note.matiere,
          notes: [],
          total: 0,
          coefficient_total: 0
        });
      }

      const matiereData = matiereMap.get(matiereId)!;
      matiereData.notes.push(note);
      matiereData.total += note.valeur * note.coefficient;
      matiereData.coefficient_total += note.coefficient;
    });

    return Array.from(matiereMap.values()).map(matiereData => ({
      matiere_id: matiereData.matiere.id,
      matiere: matiereData.matiere,
      moyenne: matiereData.coefficient_total > 0 
        ? Math.round((matiereData.total / matiereData.coefficient_total) * 100) / 100 
        : 0,
      nombre_notes: matiereData.notes.length,
      coefficient: matiereData.matiere.coefficient
    }));
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

  // ==================== DONNÉES DE TEST (TEMPORAIRES) ====================

  /**
   * ✅ CORRIGÉ: Données de test pour un élève - Toutes les propriétés requises
   */
  private getMockEleve(eleveId: number): Eleve {
    const currentUser = this.authService.getCurrentUser();
    
    return {
      id: eleveId,
      nom: currentUser?.nom || 'Dupont',
      prenom: currentUser?.prenom || 'Pierre',
      email: currentUser?.email || 'pierre.dupont@eleve.fr',
      telephone: '0123456789',
      date_naissance: '2008-05-15',
      adresse: '123 Rue de la Paix, 75001 Paris',
      numero_etudiant: 'E2024001',
      role: 'eleve',
      actif: true, // ✅ AJOUTÉ: Propriété manquante
      
      // Informations scolaires
      classe_id: 1,
      moyenne_generale: 14.5,
      rang_classe: 8,
      
      // Informations parent - Toutes définies (pas undefined)
      nom_parent: 'Dupont',
      prenom_parent: 'Marie',
      email_parent: 'marie.dupont@parent.fr',
      telephone_parent: '0678901234',
      
      // Relations
      classe: {
        id: 1,
        nom: '3ème A',
        niveau: '3ème',
        section: 'A',
        effectif_max: 30,
        effectif_actuel: 25,
        actif: true,
        moyenne: 13.2,
        created_at: '2024-09-01T00:00:00Z',
        updated_at: '2024-09-01T00:00:00Z'
      },
      
      // Métadonnées
      created_at: '2024-09-01T00:00:00Z',
      updated_at: '2024-12-01T00:00:00Z'
    };
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
      },
      {
        id: 2,
        eleve_id: 1,
        classe_id: 1,
        periode_id: 2,
        annee_scolaire: '2024-2025',
        moyenne_generale: 15.2,
        rang_classe: 6,
        total_eleves: 25,
        mention: 'Bien',
        statut: 'brouillon',
        observations_generales: 'Progression remarquable',
        created_at: '2024-04-15T10:00:00Z',
        updated_at: '2024-04-15T10:00:00Z',
        periode: {
          id: 2,
          nom: 'Trimestre 2',
          type: 'trimestre2',
          date_debut: '2025-01-06',
          date_fin: '2025-04-12',
          actif: true,
          annee_scolaire: '2024-2025',
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z'
        }
      }
    ];
  }

  /**
   * ✅ CORRIGÉ: Données de test pour les notes - Propriété 'active' ajoutée
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
          active: true, // ✅ AJOUTÉ: Propriété manquante
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
          active: true, // ✅ AJOUTÉ: Propriété manquante
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z'
        }
      },
      {
        id: 3,
        eleve_id: 1,
        matiere_id: 3,
        enseignant_id: 3,
        classe_id: 1,
        valeur: 13,
        type: 'examen' as TypeEvaluation,
        type_evaluation: 'examen' as TypeEvaluation,
        periode: 'trimestre1',
        coefficient: 2,
        date_evaluation: '2024-12-10',
        commentaire: 'Résultat correct, peut mieux faire',
        created_at: '2024-12-10T10:00:00Z',
        updated_at: '2024-12-10T10:00:00Z',
        matiere: {
          id: 3,
          nom: 'Histoire-Géographie',
          code: 'HG',
          coefficient: 3,
          actif: true,
          active: true, // ✅ AJOUTÉ: Propriété manquante
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z'
        }
      }
    ];
  }
}