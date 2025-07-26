// src/app/core/services/bulletin.service.ts
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CalculationService, MoyenneEleve } from './calculation.service';
import { PdfService } from './pdf.service';
import { NotificationService } from './notification.service';

import { 
  Bulletin, 
  GenerateBulletinRequest, 
  UpdateBulletinRequest,
  StatutBulletin,
  TypePeriode,
  Periode 
} from '../../shared/models/bulletin.model';
import { Note } from '../../shared/models/note.model';
import { Matiere } from '../../shared/models/matiere.model';
import { Eleve } from '../../shared/models/user.model';
import { Classe } from '../../shared/models/classe.model';

export interface BulletinGenerationConfig {
  periode_id: number;
  classe_id?: number;
  eleve_ids?: number[];
  generer_pdf: boolean;
  envoyer_email: boolean;
  inclure_appreciations: boolean;
  inclure_statistiques: boolean;
}

export interface BulletinGenerationResult {
  bulletins_generes: number;
  bulletins_echecs: number;
  pdfs_generes: number;
  emails_envoyes: number;
  erreurs: string[];
  bulletins: Bulletin[];
}

export interface BulletinTemplate {
  id: string;
  nom: string;
  description: string;
  champs_requis: string[];
  champs_optionnels: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BulletinService {

  private readonly templates: BulletinTemplate[] = [
    {
      id: 'standard',
      nom: 'Bulletin Standard',
      description: 'Bulletin classique avec notes et moyennes',
      champs_requis: ['moyenne_generale', 'rang_classe', 'mention'],
      champs_optionnels: ['observations_generales', 'appreciation_conseil']
    },
    {
      id: 'detaille',
      nom: 'Bulletin Détaillé',
      description: 'Bulletin avec statistiques et graphiques',
      champs_requis: ['moyenne_generale', 'rang_classe', 'mention', 'notes_bulletins'],
      champs_optionnels: ['observations_generales', 'appreciation_conseil', 'absences_justifiees', 'retards']
    },
    {
      id: 'conseil_classe',
      nom: 'Bulletin Conseil de Classe',
      description: 'Bulletin officiel avec appréciations du conseil',
      champs_requis: ['moyenne_generale', 'rang_classe', 'mention', 'appreciation_conseil'],
      champs_optionnels: ['felicitations', 'encouragements', 'avertissement_travail', 'avertissement_conduite']
    }
  ];

  constructor(
    private apiService: ApiService,
    private calculationService: CalculationService,
    private pdfService: PdfService,
    private notificationService: NotificationService
  ) {}

  /**
   * 📊 Générer automatiquement les bulletins pour une période
   */
  genererBulletinsAutomatiques(config: BulletinGenerationConfig): Observable<BulletinGenerationResult> {
    return this.validateConfiguration(config).pipe(
      switchMap(() => this.getElevesATraiter(config)),
      switchMap(eleves => this.processBulletinGeneration(eleves, config)),
      catchError(error => {
        console.error('Erreur génération automatique:', error);
        this.notificationService.error(
          'Erreur génération',
          'Impossible de générer les bulletins automatiquement'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * 📝 Générer un bulletin individuel
   */
  genererBulletinIndividuel(
    eleveId: number, 
    periodeId: number, 
    template: string = 'standard'
  ): Observable<Bulletin> {
    
    return this.preparerDonneesBulletin(eleveId, periodeId).pipe(
      switchMap(donnees => {
        const request: GenerateBulletinRequest = {
          eleve_id: eleveId,
          periode_id: periodeId,
          classe_id: donnees.eleve.classe_id,
          observations_generales: '',
          appreciation_conseil: ''
        };

        return this.creerBulletin(request, donnees.moyenneEleve, template);
      }),
      catchError(error => {
        console.error('Erreur génération bulletin individuel:', error);
        this.notificationService.error(
          'Erreur',
          `Impossible de générer le bulletin de l'élève`
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * 🔄 Mettre à jour un bulletin existant
   */
  mettreAJourBulletin(bulletinId: number, updates: UpdateBulletinRequest): Observable<Bulletin> {
    return this.apiService.put<Bulletin>(`/bulletins/${bulletinId}`, updates).pipe(
      map(bulletin => {
        this.notificationService.success(
          'Bulletin mis à jour',
          'Les modifications ont été enregistrées'
        );
        return bulletin;
      }),
      catchError(error => {
        console.error('Erreur mise à jour bulletin:', error);
        this.notificationService.error(
          'Erreur mise à jour',
          'Impossible de mettre à jour le bulletin'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * 📈 Recalculer automatiquement les moyennes et mettre à jour le bulletin
   */
  recalculerBulletin(bulletinId: number): Observable<Bulletin> {
    return this.apiService.get<Bulletin>(`/bulletins/${bulletinId}`).pipe(
      switchMap(bulletin => {
        return this.preparerDonneesBulletin(bulletin.eleve_id, bulletin.periode_id).pipe(
          switchMap(donnees => {
            const updates: UpdateBulletinRequest = {
              // Mettre à jour avec les nouvelles moyennes calculées
            };

            // Recalculer les moyennes
            const nouvelleMoyenne = donnees.moyenneEleve.moyenne_generale;
            const nouvelleMention = this.calculationService.determinerMention(nouvelleMoyenne);

            return this.apiService.put<Bulletin>(`/bulletins/${bulletinId}/recalculate`, {
              moyenne_generale: nouvelleMoyenne,
              mention: nouvelleMention,
              notes_bulletins: donnees.moyenneEleve.moyennes_matieres
            });
          })
        );
      }),
      map(bulletin => {
        this.notificationService.success(
          'Bulletin recalculé',
          'Les moyennes ont été mises à jour automatiquement'
        );
        return bulletin;
      }),
      catchError(error => {
        console.error('Erreur recalcul bulletin:', error);
        this.notificationService.error(
          'Erreur recalcul',
          'Impossible de recalculer le bulletin'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * 📊 Publier des bulletins (changer le statut de brouillon à publié)
   */
  publierBulletins(bulletinIds: number[]): Observable<{ succes: number; echecs: number }> {
    const requests = bulletinIds.map(id => 
      this.apiService.put<Bulletin>(`/bulletins/${id}/publish`, { statut: 'publie' })
    );

    return forkJoin(requests).pipe(
      map(results => {
        const succes = results.length;
        this.notificationService.success(
          'Bulletins publiés',
          `${succes} bulletin(s) publié(s) avec succès`
        );
        return { succes, echecs: 0 };
      }),
      catchError(error => {
        console.error('Erreur publication bulletins:', error);
        this.notificationService.error(
          'Erreur publication',
          'Certains bulletins n\'ont pas pu être publiés'
        );
        return of({ succes: 0, echecs: bulletinIds.length });
      })
    );
  }

  /**
   * 📄 Générer les PDFs en lot (FONCTIONNALITÉ BONUS)
   */
  genererPDFsEnLot(bulletinIds: number[]): Observable<{ success: number; failed: number; downloadUrl?: string }> {
    return this.apiService.get<Bulletin[]>(`/bulletins/batch?ids=${bulletinIds.join(',')}`).pipe(
      switchMap(bulletins => {
        const bulletinsAvecMoyennes = bulletins.map(bulletin => 
          this.preparerDonneesBulletin(bulletin.eleve_id, bulletin.periode_id).pipe(
            map(donnees => ({ bulletin, moyenneEleve: donnees.moyenneEleve }))
          )
        );

        return forkJoin(bulletinsAvecMoyennes);
      }),
      switchMap(bulletinsData => {
        return this.pdfService.telechargerBulletinsGroupe(bulletinsData);
      }),
      map(result => {
        if (result.success > 0) {
          this.notificationService.notifyBulkDownloadReady(result.success, result.downloadUrl!);
        }
        return result;
      }),
      catchError(error => {
        console.error('Erreur génération PDFs en lot:', error);
        this.notificationService.error(
          'Erreur génération PDFs',
          'Impossible de générer les PDFs en lot'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * 📊 Obtenir les statistiques de génération de bulletins
   */
  getStatistiquesBulletins(periodeId?: number, classeId?: number): Observable<{
    total_bulletins: number;
    bulletins_publies: number;
    bulletins_brouillons: number;
    moyenne_generale_periode: number;
    repartition_mentions: { [mention: string]: number };
  }> {
    const params = new URLSearchParams();
    if (periodeId) params.append('periode_id', periodeId.toString());
    if (classeId) params.append('classe_id', classeId.toString());

    return this.apiService.get(`/bulletins/statistiques?${params.toString()}`).pipe(
      catchError(error => {
        console.error('Erreur récupération statistiques:', error);
        return of({
          total_bulletins: 0,
          bulletins_publies: 0,
          bulletins_brouillons: 0,
          moyenne_generale_periode: 0,
          repartition_mentions: {}
        });
      })
    );
  }

  /**
   * 🔍 Rechercher des bulletins avec filtres
   */
  rechercherBulletins(filtres: {
    eleve_id?: number;
    classe_id?: number;
    periode_id?: number;
    statut?: StatutBulletin;
    annee_scolaire?: string;
    moyenne_min?: number;
    moyenne_max?: number;
  }): Observable<Bulletin[]> {
    const params = new URLSearchParams();
    Object.entries(filtres).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return this.apiService.get<Bulletin[]>(`/bulletins/search?${params.toString()}`).pipe(
      catchError(error => {
        console.error('Erreur recherche bulletins:', error);
        return of([]);
      })
    );
  }

  /**
   * 🎯 Obtenir les élèves sans bulletin pour une période
   */
  getElevesSansBulletin(periodeId: number, classeId?: number): Observable<Eleve[]> {
    const params = new URLSearchParams();
    params.append('periode_id', periodeId.toString());
    if (classeId) params.append('classe_id', classeId.toString());

    return this.apiService.get<Eleve[]>(`/bulletins/eleves-sans-bulletin?${params.toString()}`).pipe(
      catchError(error => {
        console.error('Erreur récupération élèves sans bulletin:', error);
        return of([]);
      })
    );
  }

  /**
   * 📋 Obtenir les templates de bulletin disponibles
   */
  getTemplates(): BulletinTemplate[] {
    return [...this.templates];
  }

  /**
   * 📝 Obtenir un template spécifique
   */
  getTemplate(templateId: string): BulletinTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * ✅ Valider la configuration de génération
   */
  private validateConfiguration(config: BulletinGenerationConfig): Observable<boolean> {
    if (!config.periode_id) {
      return throwError(() => new Error('Période requise pour la génération'));
    }

    return this.apiService.get<Periode>(`/periodes/${config.periode_id}`).pipe(
      map(periode => {
        if (!periode.actif) {
          throw new Error('La période sélectionnée n\'est pas active');
        }
        return true;
      })
    );
  }

  /**
   * 👥 Obtenir la liste des élèves à traiter
   */
  private getElevesATraiter(config: BulletinGenerationConfig): Observable<Eleve[]> {
    if (config.eleve_ids && config.eleve_ids.length > 0) {
      // Élèves spécifiques
      return this.apiService.get<Eleve[]>(`/eleves?ids=${config.eleve_ids.join(',')}`);
    } else if (config.classe_id) {
      // Toute la classe
      return this.apiService.get<Eleve[]>(`/classes/${config.classe_id}/eleves`);
    } else {
      return throwError(() => new Error('Aucun élève spécifié pour la génération'));
    }
  }

  /**
   * 🔄 Traiter la génération des bulletins
   */
  private processBulletinGeneration(
    eleves: Eleve[], 
    config: BulletinGenerationConfig
  ): Observable<BulletinGenerationResult> {
    const result: BulletinGenerationResult = {
      bulletins_generes: 0,
      bulletins_echecs: 0,
      pdfs_generes: 0,
      emails_envoyes: 0,
      erreurs: [],
      bulletins: []
    };

    const generationPromises = eleves.map(eleve => 
      this.genererBulletinPourEleve(eleve, config).toPromise()
        .then(bulletin => {
          result.bulletins_generes++;
          result.bulletins.push(bulletin);
          return bulletin;
        })
        .catch(error => {
          result.bulletins_echecs++;
          result.erreurs.push(`${eleve.nom} ${eleve.prenom}: ${error.message}`);
          return null;
        })
    );

    return Promise.all(generationPromises).then(() => {
      this.notificationService.success(
        'Génération terminée',
        `${result.bulletins_generes} bulletin(s) généré(s) avec succès`
      );
      
      if (result.bulletins_echecs > 0) {
        this.notificationService.warning(
          'Avertissement',
          `${result.bulletins_echecs} bulletin(s) n'ont pas pu être générés`
        );
      }

      return of(result);
    });
  }

  /**
   * 📝 Générer un bulletin pour un élève spécifique
   */
  private genererBulletinPourEleve(eleve: Eleve, config: BulletinGenerationConfig): Observable<Bulletin> {
    return this.preparerDonneesBulletin(eleve.id, config.periode_id).pipe(
      switchMap(donnees => {
        const request: GenerateBulletinRequest = {
          eleve_id: eleve.id,
          periode_id: config.periode_id,
          classe_id: eleve.classe_id
        };

        return this.creerBulletin(request, donnees.moyenneEleve);
      })
    );
  }

  /**
   * 📊 Préparer les données nécessaires pour un bulletin
   */
  private preparerDonneesBulletin(eleveId: number, periodeId: number): Observable<{
    eleve: Eleve;
    periode: Periode;
    notes: Note[];
    matieres: Matiere[];
    moyenneEleve: MoyenneEleve;
  }> {
    return forkJoin({
      eleve: this.apiService.get<Eleve>(`/eleves/${eleveId}`),
      periode: this.apiService.get<Periode>(`/periodes/${periodeId}`),
      notes: this.apiService.get<Note[]>(`/eleves/${eleveId}/notes?periode_id=${periodeId}`),
      matieres: this.apiService.get<Matiere[]>('/matieres')
    }).pipe(
      switchMap(donnees => {
        return this.calculationService.calculerMoyennesEleve(
          eleveId,
          donnees.notes,
          donnees.matieres,
          donnees.periode.type as TypePeriode
        ).pipe(
          map(moyenneEleve => ({
            ...donnees,
            moyenneEleve
          }))
        );
      })
    );
  }

  /**
   * 📝 Créer un bulletin dans la base de données
   */
  private creerBulletin(
    request: GenerateBulletinRequest, 
    moyenneEleve: MoyenneEleve,
    template: string = 'standard'
  ): Observable<Bulletin> {
    const bulletinData = {
      ...request,
      moyenne_generale: moyenneEleve.moyenne_generale,
      mention: moyenneEleve.mention,
      statut: 'brouillon' as StatutBulletin,
      notes_bulletins: moyenneEleve.moyennes_matieres.map(matiere => ({
        matiere_id: matiere.matiere_id,
        matiere_nom: matiere.matiere_nom,
        matiere_code: matiere.matiere_code,
        coefficient: matiere.coefficient,
        moyenne: matiere.moyenne,
        notes: matiere.notes
      }))
    };

    return this.apiService.post<Bulletin>('/bulletins', bulletinData);
  }

  /**
   * 🎨 Obtenir la couleur selon la mention
   */
  getCouleurMention(mention: string): string {
    const couleurs: { [key: string]: string } = {
      'Excellent': 'text-green-600',
      'Très Bien': 'text-blue-600',
      'Bien': 'text-yellow-600',
      'Assez Bien': 'text-orange-600',
      'Passable': 'text-red-400',
      'Insuffisant': 'text-red-600'
    };
    return couleurs[mention] || 'text-gray-600';
  }

  /**
   * 🔄 Synchroniser les bulletins avec les nouvelles notes
   */
  synchroniserBulletinsAvecNotes(periodeId: number, classeId?: number): Observable<number> {
    const params = new URLSearchParams();
    params.append('periode_id', periodeId.toString());
    if (classeId) params.append('classe_id', classeId.toString());

    return this.apiService.post<{ bulletins_mis_a_jour: number }>(`/bulletins/synchronize?${params.toString()}`, {}).pipe(
      map(response => {
        this.notificationService.success(
          'Synchronisation terminée',
          `${response.bulletins_mis_a_jour} bulletin(s) mis à jour`
        );
        return response.bulletins_mis_a_jour;
      }),
      catchError(error => {
        console.error('Erreur synchronisation:', error);
        this.notificationService.error(
          'Erreur synchronisation',
          'Impossible de synchroniser les bulletins'
        );
        return throwError(() => error);
      })
    );
  }
}