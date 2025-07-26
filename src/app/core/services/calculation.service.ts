// src/app/core/services/calculation.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Note, TypePeriode } from '../../shared/models/note.model';
import { Matiere } from '../../shared/models/matiere.model';
import { Eleve } from '../../shared/models/user.model';

export interface MoyenneMatiere {
  matiere_id: number;
  matiere_nom: string;
  matiere_code: string;
  coefficient: number;
  notes: Note[];
  moyenne: number;
  nombre_notes: number;
}

export interface MoyenneEleve {
  eleve_id: number;
  eleve?: Eleve;
  moyenne_generale: number;
  moyennes_matieres: MoyenneMatiere[];
  rang_classe?: number;
  mention: string;
  total_notes: number;
  periode: TypePeriode;
}

export interface RangClassement {
  eleve_id: number;
  moyenne: number;
  rang: number;
  mention: string;
}

export interface StatistiquesClasse {
  classe_id: number;
  periode: TypePeriode;
  moyenne_classe: number;
  mediane: number;
  note_max: number;
  note_min: number;
  ecart_type: number;
  repartition_mentions: { [mention: string]: number };
  taux_reussite: number; // % d'élèves avec moyenne >= 10
}

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  constructor() {}

  /**
   * 🧮 Calculer la moyenne d'une matière pour un élève
   */
  calculerMoyenneMatiere(notes: Note[]): number {
    if (!notes || notes.length === 0) {
      return 0;
    }

    let sommeNotesPonderees = 0;
    let sommeCoefficients = 0;

    notes.forEach(note => {
      const coefficient = note.coefficient || 1;
      sommeNotesPonderees += note.valeur * coefficient;
      sommeCoefficients += coefficient;
    });

    return sommeCoefficients > 0 ? sommeNotesPonderees / sommeCoefficients : 0;
  }

  /**
   * 🎯 Calculer la moyenne générale d'un élève
   */
  calculerMoyenneGenerale(moyennesMatieres: MoyenneMatiere[]): number {
    if (!moyennesMatieres || moyennesMatieres.length === 0) {
      return 0;
    }

    let sommeMoyennesPonderees = 0;
    let sommeCoefficients = 0;

    moyennesMatieres.forEach(moyenneMatiere => {
      if (moyenneMatiere.nombre_notes > 0) { // Seules les matières avec notes
        sommeMoyennesPonderees += moyenneMatiere.moyenne * moyenneMatiere.coefficient;
        sommeCoefficients += moyenneMatiere.coefficient;
      }
    });

    return sommeCoefficients > 0 ? sommeMoyennesPonderees / sommeCoefficients : 0;
  }

  /**
   * 🏆 Déterminer la mention selon la moyenne
   */
  determinerMention(moyenne: number): string {
    if (moyenne >= 16) return 'Excellent';
    if (moyenne >= 14) return 'Très Bien';
    if (moyenne >= 12) return 'Bien';
    if (moyenne >= 10) return 'Assez Bien';
    if (moyenne >= 8) return 'Passable';
    return 'Insuffisant';
  }

  /**
   * 📊 Calculer toutes les moyennes d'un élève par période
   */
  calculerMoyennesEleve(
    eleveId: number, 
    notes: Note[], 
    matieres: Matiere[], 
    periode: TypePeriode
  ): Observable<MoyenneEleve> {
    
    // Filtrer les notes de l'élève pour la période donnée
    const notesEleve = notes.filter(n => 
      n.eleve_id === eleveId && n.periode === periode
    );

    // Grouper les notes par matière
    const notesParMatiere = this.grouperNotesParMatiere(notesEleve);

    // Calculer les moyennes par matière
    const moyennesMatieres: MoyenneMatiere[] = matieres.map(matiere => {
      const notesMatiere = notesParMatiere[matiere.id] || [];
      const moyenne = this.calculerMoyenneMatiere(notesMatiere);

      return {
        matiere_id: matiere.id,
        matiere_nom: matiere.nom,
        matiere_code: matiere.code,
        coefficient: matiere.coefficient,
        notes: notesMatiere,
        moyenne: this.arrondir(moyenne),
        nombre_notes: notesMatiere.length
      };
    }).filter(m => m.nombre_notes > 0); // Garder seulement les matières avec notes

    // Calculer la moyenne générale
    const moyenneGenerale = this.calculerMoyenneGenerale(moyennesMatieres);
    const mention = this.determinerMention(moyenneGenerale);

    const resultat: MoyenneEleve = {
      eleve_id: eleveId,
      moyenne_generale: this.arrondir(moyenneGenerale),
      moyennes_matieres: moyennesMatieres,
      mention,
      total_notes: notesEleve.length,
      periode
    };

    return of(resultat);
  }

  /**
   * 🏅 Calculer les rangs dans une classe
   */
  calculerRangsClasse(moyennesEleves: MoyenneEleve[]): RangClassement[] {
    // Trier par moyenne décroissante
    const elevesTriesParMoyenne = moyennesEleves
      .map(eleve => ({
        eleve_id: eleve.eleve_id,
        moyenne: eleve.moyenne_generale,
        mention: eleve.mention
      }))
      .sort((a, b) => b.moyenne - a.moyenne);

    // Attribuer les rangs (gérer les ex-aequo)
    const rangs: RangClassement[] = [];
    let rangActuel = 1;

    for (let i = 0; i < elevesTriesParMoyenne.length; i++) {
      const eleve = elevesTriesParMoyenne[i];
      
      // Si même moyenne que le précédent, même rang
      if (i > 0 && eleve.moyenne === elevesTriesParMoyenne[i - 1].moyenne) {
        rangs.push({
          ...eleve,
          rang: rangs[i - 1].rang
        });
      } else {
        rangs.push({
          ...eleve,
          rang: rangActuel
        });
      }
      
      rangActuel = i + 2; // Le prochain rang possible
    }

    return rangs;
  }

  /**
   * 📈 Calculer les statistiques d'une classe
   */
  calculerStatistiquesClasse(
    classeId: number,
    moyennesEleves: MoyenneEleve[],
    periode: TypePeriode
  ): Observable<StatistiquesClasse> {
    
    const moyennes = moyennesEleves.map(e => e.moyenne_generale);
    
    if (moyennes.length === 0) {
      return of({
        classe_id: classeId,
        periode,
        moyenne_classe: 0,
        mediane: 0,
        note_max: 0,
        note_min: 0,
        ecart_type: 0,
        repartition_mentions: {},
        taux_reussite: 0
      });
    }

    // Statistiques de base
    const moyenneClasse = moyennes.reduce((sum, m) => sum + m, 0) / moyennes.length;
    const moyennesTriees = [...moyennes].sort((a, b) => a - b);
    const mediane = this.calculerMediane(moyennesTriees);
    const noteMax = Math.max(...moyennes);
    const noteMin = Math.min(...moyennes);
    const ecartType = this.calculerEcartType(moyennes, moyenneClasse);

    // Répartition des mentions
    const repartitionMentions: { [mention: string]: number } = {};
    moyennesEleves.forEach(eleve => {
      repartitionMentions[eleve.mention] = (repartitionMentions[eleve.mention] || 0) + 1;
    });

    // Taux de réussite (moyenne >= 10)
    const elevesReussis = moyennes.filter(m => m >= 10).length;
    const tauxReussite = (elevesReussis / moyennes.length) * 100;

    const statistiques: StatistiquesClasse = {
      classe_id: classeId,
      periode,
      moyenne_classe: this.arrondir(moyenneClasse),
      mediane: this.arrondir(mediane),
      note_max: this.arrondir(noteMax),
      note_min: this.arrondir(noteMin),
      ecart_type: this.arrondir(ecartType),
      repartition_mentions: repartitionMentions,
      taux_reussite: this.arrondir(tauxReussite)
    };

    return of(statistiques);
  }

  /**
   * 🔄 Recalculer automatiquement après ajout/modification de note
   */
  recalculerApresModificationNote(
    noteModifiee: Note,
    toutesLesNotes: Note[],
    matieres: Matiere[]
  ): Observable<MoyenneEleve> {
    return this.calculerMoyennesEleve(
      noteModifiee.eleve_id,
      toutesLesNotes,
      matieres,
      noteModifiee.periode
    );
  }

  /**
   * 🎯 Identifier les élèves en difficulté
   */
  identifierElevesEnDifficulte(
    moyennesEleves: MoyenneEleve[],
    seuilDifficulte: number = 8
  ): MoyenneEleve[] {
    return moyennesEleves
      .filter(eleve => eleve.moyenne_generale < seuilDifficulte)
      .sort((a, b) => a.moyenne_generale - b.moyenne_generale);
  }

  /**
   * 🌟 Identifier les excellents élèves
   */
  identifierExcellentsEleves(
    moyennesEleves: MoyenneEleve[],
    seuilExcellence: number = 14
  ): MoyenneEleve[] {
    return moyennesEleves
      .filter(eleve => eleve.moyenne_generale >= seuilExcellence)
      .sort((a, b) => b.moyenne_generale - a.moyenne_generale);
  }

  /**
   * 📊 Analyser l'évolution d'un élève entre périodes
   */
  analyserEvolutionEleve(
    moyennesPeriodePrecedente: MoyenneEleve,
    moyennesPeriodeActuelle: MoyenneEleve
  ): {
    evolution_generale: number;
    progression: 'amélioration' | 'stabilité' | 'baisse';
    matieres_en_progression: string[];
    matieres_en_baisse: string[];
  } {
    const evolutionGenerale = moyennesPeriodeActuelle.moyenne_generale - moyennesPeriodePrecedente.moyenne_generale;
    
    let progression: 'amélioration' | 'stabilité' | 'baisse';
    if (evolutionGenerale > 0.5) progression = 'amélioration';
    else if (evolutionGenerale < -0.5) progression = 'baisse';
    else progression = 'stabilité';

    const matieresEnProgression: string[] = [];
    const matieresEnBaisse: string[] = [];

    moyennesPeriodeActuelle.moyennes_matieres.forEach(matiereActuelle => {
      const matierePrecedente = moyennesPeriodePrecedente.moyennes_matieres
        .find(m => m.matiere_id === matiereActuelle.matiere_id);
      
      if (matierePrecedente) {
        const evolution = matiereActuelle.moyenne - matierePrecedente.moyenne;
        if (evolution > 1) {
          matieresEnProgression.push(matiereActuelle.matiere_nom);
        } else if (evolution < -1) {
          matieresEnBaisse.push(matiereActuelle.matiere_nom);
        }
      }
    });

    return {
      evolution_generale: this.arrondir(evolutionGenerale),
      progression,
      matieres_en_progression: matieresEnProgression,
      matieres_en_baisse: matieresEnBaisse
    };
  }

  // ===== MÉTHODES UTILITAIRES PRIVÉES =====

  private grouperNotesParMatiere(notes: Note[]): { [matiereId: number]: Note[] } {
    return notes.reduce((groupes, note) => {
      if (!groupes[note.matiere_id]) {
        groupes[note.matiere_id] = [];
      }
      groupes[note.matiere_id].push(note);
      return groupes;
    }, {} as { [matiereId: number]: Note[] });
  }

  private calculerMediane(valeurs: number[]): number {
    const n = valeurs.length;
    if (n % 2 === 0) {
      return (valeurs[n / 2 - 1] + valeurs[n / 2]) / 2;
    } else {
      return valeurs[Math.floor(n / 2)];
    }
  }

  private calculerEcartType(valeurs: number[], moyenne: number): number {
    const variance = valeurs.reduce((sum, valeur) => 
      sum + Math.pow(valeur - moyenne, 2), 0
    ) / valeurs.length;
    return Math.sqrt(variance);
  }

  private arrondir(valeur: number, decimales: number = 2): number {
    return Math.round(valeur * Math.pow(10, decimales)) / Math.pow(10, decimales);
  }

  /**
   * 🔧 Valider qu'une note est dans la plage acceptable
   */
  validerNote(valeur: number): boolean {
    return valeur >= 0 && valeur <= 20;
  }

  /**
   * 🎨 Obtenir la couleur selon la moyenne
   */
  getCouleurMoyenne(moyenne: number): string {
    if (moyenne >= 16) return 'text-green-600';
    if (moyenne >= 14) return 'text-blue-600';
    if (moyenne >= 12) return 'text-yellow-600';
    if (moyenne >= 10) return 'text-orange-600';
    if (moyenne >= 8) return 'text-red-400';
    return 'text-red-600';
  }

  /**
   * 📅 Obtenir le libellé de la période
   */
  getLibellePeriode(periode: TypePeriode): string {
    const periodes = {
      'trimestre1': '1er Trimestre',
      'trimestre2': '2ème Trimestre',
      'trimestre3': '3ème Trimestre'
    };
    return periodes[periode] || periode;
  }
}