// src/app/features/enseignant/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { EnseignantService } from '../../../core/services/enseignant.service';
import { User, Enseignant } from '../../../shared/models/user.model';
import { Classe } from '../../../shared/models/classe.model';
import { Matiere } from '../../../shared/models/matiere.model';

// ✅ INTERFACES POUR LES DONNÉES API
interface DashboardApiResponse {
  message: string;
  statut: string;
  dashboard: {
    mes_classes: Array<{
      id: number;
      nom: string;
      niveau: string;
      section: string;
      effectif_actuel: number;
      effectif_max: number;
      taux_remplissage: number;
    }>;
    mes_matieres: Array<{
      id: number;
      nom: string;
      code: string;
      coefficient: string;
      nombre_notes_saisies: number;
      moyenne_generale: number;
    }>;
    mes_statistiques: {
      total_notes_saisies: number;
      notes_aujourd_hui: number;
      notes_cette_semaine: number;
      total_eleves: number;
      nombre_classes: number;
      nombre_matieres: number;
      moyennes_par_type_evaluation: any[];
    };
    activite_recente: {
      dernieres_notes: any[];
      derniere_connexion: string;
    };
    planning: {
      mes_enseignements: Array<{
        classe: string;
        matiere: string;
        code_matiere: string;
        coefficient: string;
        effectif_classe: number;
      }>;
      total_heures_estimees: number;
    };
  };
}

// ✅ INTERFACE POUR LES DONNÉES MAPPÉES
interface DashboardData {
  stats: {
    totalClasses: number;
    totalMatieres: number;
    totalEleves: number;
    notesSaisies: number;
    notesAujourdhui: number;
    notesCetteSemaine: number;
    moyenneGenerale: number;
  };
  classes: any[];
  matieres: any[];
  recentActivity: any[];
  planning: any;
  rawData: DashboardApiResponse['dashboard']; // Garder l'accès aux données brutes
}

@Component({
  selector: 'app-enseignant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class EnseignantDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  dashboardData: DashboardData | null = null;
  isLoading = false;
  errorMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private enseignantService: EnseignantService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user as User;
        if (user && user.id) {
          this.loadDashboardData();
        }
      });
  }

  // ✅ MÉTHODE CORRIGÉE : Utilise directement getDashboardData du service
  public loadDashboardData(): void {
    if (!this.currentUser?.id) return;

    this.isLoading = true;
    this.errorMessage = '';

    // ✅ Utiliser la nouvelle méthode getDashboardData au lieu de loadDashboardData
    this.enseignantService.getDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DashboardApiResponse) => {
          console.log('📊 Données reçues:', response);
          
          // ✅ MAPPER les données API vers la structure attendue par le template
          this.dashboardData = this.mapApiResponseToDashboardData(response);
          console.log('🎯 Données mappées:', this.dashboardData);
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des données:', error);
          this.errorMessage = 'Impossible de charger les données du tableau de bord.';
          this.isLoading = false;
        }
      });
  }

  // ✅ MÉTHODE DE MAPPING : Transformer les données API vers la structure du template
  private mapApiResponseToDashboardData(response: DashboardApiResponse): DashboardData {
    const dashboard = response.dashboard;
    const stats = dashboard.mes_statistiques;
    
    // Calculer la moyenne générale des matières
    const moyenneGenerale = dashboard.mes_matieres.length > 0 
      ? dashboard.mes_matieres.reduce((sum, matiere) => sum + (matiere.moyenne_generale || 0), 0) / dashboard.mes_matieres.length
      : 0;
    
    return {
      stats: {
        totalClasses: stats.nombre_classes || 0,
        totalMatieres: stats.nombre_matieres || 0,
        totalEleves: stats.total_eleves || 0,
        notesSaisies: stats.total_notes_saisies || 0,
        notesAujourdhui: stats.notes_aujourd_hui || 0,
        notesCetteSemaine: stats.notes_cette_semaine || 0,
        moyenneGenerale: Math.round(moyenneGenerale * 100) / 100 // Arrondir à 2 décimales
      },
      classes: dashboard.mes_classes.map(classe => ({
        ...classe,
        // Ajouter les propriétés manquantes pour la compatibilité
        statut: 'actif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })),
      matieres: dashboard.mes_matieres.map(matiere => ({
        ...matiere,
        coefficient: parseFloat(matiere.coefficient) || 1,
        // Ajouter les propriétés manquantes pour la compatibilité
        description: '',
        statut: 'actif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })),
      recentActivity: dashboard.activite_recente.dernieres_notes || [],
      planning: dashboard.planning,
      rawData: dashboard // Garder l'accès aux données brutes
    };
  }

  refreshData(): void {
    if (this.currentUser?.id) {
      // ✅ Invalider le cache et recharger
      this.enseignantService.clearCache();
      this.loadDashboardData();
    }
  }

  // ✅ MÉTHODES HELPER SÉCURISÉES

  /**
   * Vérifier si l'activité récente existe et n'est pas vide
   */
  hasRecentActivity(): boolean {
    return this.dashboardData?.recentActivity !== undefined && 
           this.dashboardData?.recentActivity !== null && 
           this.dashboardData.recentActivity.length > 0;
  }

  /**
   * Obtenir l'activité récente de manière sécurisée
   */
  getRecentActivity() {
    return this.dashboardData?.recentActivity || [];
  }

  /**
   * Vérifier si les classes existent et ne sont pas vides
   */
  hasClasses(): boolean {
    return this.dashboardData?.classes !== undefined && 
           this.dashboardData?.classes !== null && 
           this.dashboardData.classes.length > 0;
  }

  /**
   * Obtenir les classes de manière sécurisée
   */
  getClasses() {
    return this.dashboardData?.classes || [];
  }

  /**
   * Vérifier si les matières existent et ne sont pas vides
   */
  hasMatieres(): boolean {
    return this.dashboardData?.matieres !== undefined && 
           this.dashboardData?.matieres !== null && 
           this.dashboardData.matieres.length > 0;
  }

  /**
   * Obtenir les matières de manière sécurisée
   */
  getMatieres() {
    return this.dashboardData?.matieres || [];
  }

  // ✅ NOUVELLES MÉTHODES UTILITAIRES pour accéder aux données spécifiques

  /**
   * Obtenir la dernière connexion
   */
  getDerniereConnexion(): string {
    return this.dashboardData?.rawData?.activite_recente?.derniere_connexion || '';
  }

  /**
   * Obtenir les enseignements du planning
   */
  getMesEnseignements() {
    return this.dashboardData?.planning?.mes_enseignements || [];
  }

  /**
   * Obtenir le total d'heures estimées
   */
  getTotalHeuresEstimees(): number {
    return this.dashboardData?.planning?.total_heures_estimees || 0;
  }

  /**
   * Obtenir les statistiques détaillées (accès direct aux données brutes)
   */
  getDetailedStats() {
    return this.dashboardData?.rawData?.mes_statistiques;
  }

  /**
   * Vérifier si on a des enseignements planifiés
   */
  hasEnseignements(): boolean {
    const enseignements = this.getMesEnseignements();
    return enseignements && enseignements.length > 0;
  }

  /**
   * Obtenir le pourcentage de progression (exemple de calcul)
   */
  getProgressionPourcentage(): number {
    const stats = this.dashboardData?.stats;
    if (!stats) return 0;
    
    // Exemple : calcul basé sur les notes saisies vs objectif théorique
    const objectifNotes = stats.totalEleves * stats.totalMatieres * 3; // 3 notes par élève par matière
    if (objectifNotes === 0) return 0;
    
    return Math.min(100, Math.round((stats.notesSaisies / objectifNotes) * 100));
  }
}