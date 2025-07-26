// src/app/features/enseignant/dashboard/dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { NoteService } from '../../../core/services/note.service';
import { ClasseService } from '../../../core/services/classe.service';
import { MatiereService } from '../../../core/services/matiere.service';
import { Enseignant, User } from '../../../shared/models/user.model';
import { Classe } from '../../../shared/models/classe.model';
import { Matiere } from '../../../shared/models/matiere.model';
import { Note } from '../../../shared/models/note.model';

interface DashboardStats {
  mesClasses: number;
  mesMatieres: number;
  totalEleves: number;
  notesSaisies: number;
}

interface RecentActivity {
  id: number;
  type: 'note_added' | 'note_updated' | 'note_deleted';
  message: string;
  timestamp: Date;
}

interface ClasseData {
  id: number;
  nom: string;
  effectif: number;
}

interface MatiereData {
  id: number;
  nom: string;
  coefficient: number;
  nb_classes: number;
}

@Component({
  selector: 'app-enseignant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class EnseignantDashboardComponent implements OnInit {
  // État du composant
  isLoading = true;
  error: string | null = null;
  
  // Données du dashboard
  currentEnseignant: Enseignant | null = null;
  stats: DashboardStats = {
    mesClasses: 0,
    mesMatieres: 0,
    totalEleves: 0,
    notesSaisies: 0
  };
  
  classesData: ClasseData[] = [];
  matieresData: MatiereData[] = [];
  recentActivities: RecentActivity[] = [];
  
  // Données pour les graphiques (si nécessaire plus tard)
  notesParPeriode: any[] = [];
  moyennesParClasse: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private noteService: NoteService,
    private classeService: ClasseService,
    private matiereService: MatiereService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Charger toutes les données du dashboard
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // FIX: Utiliser la méthode synchrone getCurrentUser() qui existe dans le service
    const user = this.authService.getCurrentUser();
    
    if (user && user.role === 'enseignant') {
      this.currentEnseignant = user as Enseignant;
      this.loadEnseignantData();
    } else {
      this.error = 'Accès non autorisé';
      this.isLoading = false;
    }
  }

  /**
   * Charger les données spécifiques à l'enseignant
   */
  private loadEnseignantData(): void {
    if (!this.currentEnseignant) return;

    const enseignantId = this.currentEnseignant.id;

    // FIX: Utiliser getClasses() SANS filtre enseignant_id (qui n'existe pas) 
    // et filtrer côté client temporairement
    this.classeService.getClasses().pipe(
      catchError((error: any) => {
        console.error('Erreur lors du chargement des classes:', error);
        return of({ data: [] });
      })
    ).subscribe((response: any) => {
      const allClasses = response.data || [];
      
      // FIX: Filtrer côté client les classes de l'enseignant
      // (en attendant que l'API supporte le filtre enseignant_id)
      const classes = allClasses.filter((classe: Classe) => {
        // Logique temporaire : si l'enseignant a des classes assignées
        return classe.enseignants?.some(ens => ens.id === enseignantId) || false;
      });

      this.classesData = classes.map((classe: Classe) => ({
        id: classe.id,
        nom: classe.nom,
        // FIX: Utiliser effectif_actuel qui existe dans le modèle Classe
        effectif: classe.effectif_actuel || 0
      }));
      
      this.stats.mesClasses = classes.length;
      this.stats.totalEleves = classes.reduce((total: number, classe: Classe) => 
        total + (classe.effectif_actuel || 0), 0);
    });

    // FIX: Utiliser getMatieres() SANS filtre enseignant_id et filtrer côté client
    this.matiereService.getMatieres().pipe(
      catchError((error: any) => {
        console.error('Erreur lors du chargement des matières:', error);
        return of({ data: [] });
      })
    ).subscribe((response: any) => {
      const allMatieres = response.data || [];
      
      // FIX: Filtrer côté client les matières de l'enseignant
      const matieres = allMatieres.filter((matiere: Matiere) => {
        return matiere.enseignants?.some(ens => ens.id === enseignantId) || false;
      });

      this.matieresData = matieres.map((matiere: Matiere) => ({
        id: matiere.id,
        nom: matiere.nom,
        coefficient: matiere.coefficient,
        nb_classes: 0 // À calculer si nécessaire
      }));
      
      this.stats.mesMatieres = matieres.length;
    });

    // Charger le nombre de notes saisies avec le filtre enseignant_id qui EXISTE dans NoteFilters
    this.noteService.getNotes({
      enseignant_id: enseignantId,
      per_page: 1 // On veut juste le total
    }).pipe(
      catchError((error: any) => {
        console.error('Erreur lors du chargement des notes:', error);
        return of({ data: [], meta: { total: 0 } });
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response: any) => {
      this.stats.notesSaisies = response.meta?.total || 0;
    });

    // Charger les activités récentes (simulé pour l'instant)
    this.loadRecentActivities();
  }

  /**
   * Charger les activités récentes
   */
  private loadRecentActivities(): void {
    // Pour l'instant, on simule des activités récentes
    // Plus tard, cela pourra venir d'un service dédié
    this.recentActivities = [
      {
        id: 1,
        type: 'note_added',
        message: 'Note ajoutée pour Jean Dupont en Mathématiques',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // il y a 2h
      },
      {
        id: 2,
        type: 'note_updated',
        message: 'Note modifiée pour Marie Martin en Français',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // il y a 4h
      },
      {
        id: 3,
        type: 'note_added',
        message: 'Notes en lot ajoutées pour la classe 6A',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // il y a 1 jour
      }
    ];
  }

  /**
   * Navigation vers la gestion des notes
   */
  navigateToNotes(): void {
    this.router.navigate(['/enseignant/notes']);
  }

  /**
   * Navigation vers une classe spécifique
   */
  navigateToClasse(classeId: number): void {
    this.router.navigate(['/enseignant/classes', classeId]);
  }

  /**
   * Navigation vers une matière spécifique
   */
  navigateToMatiere(matiereId: number): void {
    this.router.navigate(['/enseignant/matieres', matiereId]);
  }

  /**
   * Actualiser les données
   */
  refresh(): void {
    this.loadDashboardData();
  }

  /**
   * Obtenir l'icône pour le type d'activité
   */
  getActivityIcon(type: RecentActivity['type']): string {
    switch (type) {
      case 'note_added':
        return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
      case 'note_updated':
        return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      case 'note_deleted':
        return 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  /**
   * Formater la date relative
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `il y a ${minutes} min`;
    } else if (hours < 24) {
      return `il y a ${hours}h`;
    } else {
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  }
}