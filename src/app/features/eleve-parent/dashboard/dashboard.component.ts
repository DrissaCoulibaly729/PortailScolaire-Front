// src/app/features/eleve-parent/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { EleveParentService } from '../../../core/services/eleve-parent.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

import { Bulletin } from '../../../shared/models/bulletin.model';
import { Note } from '../../../shared/models/note.model';
import { Eleve, User } from '../../../shared/models/user.model';

interface DashboardStats {
  moyenneGenerale: number;
  nombreNotes: number;
  nombreBulletins: number;
  rangClasse: number | null;
  mentionActuelle: string;
}

interface RecentActivity {
  id: string;
  type: 'note' | 'bulletin' | 'message';
  title: string;
  description: string;
  date: Date;
  urgent: boolean;
}

@Component({
  selector: 'app-eleve-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class EleveDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // État du composant
  isLoading = true;
  error = '';
  currentUser: User | null = null;
  eleve: Eleve | null = null;

  // Données du dashboard
  stats: DashboardStats = {
    moyenneGenerale: 0,
    nombreNotes: 0,
    nombreBulletins: 0,
    rangClasse: null,
    mentionActuelle: ''
  };

  recentBulletins: Bulletin[] = [];
  recentNotes: Note[] = [];
  recentActivities: RecentActivity[] = [];

  // États d'affichage
  showWelcomeMessage = true;

  constructor(
    private eleveParentService: EleveParentService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser() as User;
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ CORRIGÉ: Charger toutes les données du dashboard
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = '';

    // Charger les données en parallèle
    forkJoin({
      eleve: this.eleveParentService.getEleveDetails(),
      bulletins: this.eleveParentService.getBulletins(),
      notes: this.eleveParentService.getNotesEleve(),
      moyennes: this.eleveParentService.getMoyennesParMatiere()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        // Vérifier que toutes les données sont accessibles
        if (data.eleve.allowed && data.eleve.data) {
          this.eleve = data.eleve.data;
          this.processEleveData();
        }

        if (data.bulletins.allowed && data.bulletins.data) {
          this.recentBulletins = data.bulletins.data
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3);
        }

        if (data.notes.allowed && data.notes.data) {
          this.recentNotes = data.notes.data
            .sort((a, b) => new Date(b.date_evaluation).getTime() - new Date(a.date_evaluation).getTime())
            .slice(0, 5);
        }

        this.calculateStats();
        this.generateRecentActivities();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.error = 'Impossible de charger les données du tableau de bord';
        this.isLoading = false;
      }
    });
  }

  /**
   * Traiter les données de l'élève
   */
  private processEleveData(): void {
    if (this.eleve) {
      this.stats.moyenneGenerale = this.eleve.moyenne_generale || 0;
      this.stats.rangClasse = this.eleve.rang_classe || null;
      this.stats.mentionActuelle = this.calculateMention(this.stats.moyenneGenerale);
    }
  }

  /**
   * Calculer les statistiques
   */
  private calculateStats(): void {
    this.stats.nombreBulletins = this.recentBulletins.length;
    this.stats.nombreNotes = this.recentNotes.length;

    // Recalculer la moyenne si nécessaire
    if (!this.stats.moyenneGenerale && this.recentNotes.length > 0) {
      const total = this.recentNotes.reduce((sum, note) => sum + (note.valeur * note.coefficient), 0);
      const totalCoeff = this.recentNotes.reduce((sum, note) => sum + note.coefficient, 0);
      this.stats.moyenneGenerale = totalCoeff > 0 ? total / totalCoeff : 0;
      this.stats.mentionActuelle = this.calculateMention(this.stats.moyenneGenerale);
    }
  }

  /**
   * Générer les activités récentes
   */
  private generateRecentActivities(): void {
    const activities: RecentActivity[] = [];

    // Ajouter les dernières notes
    this.recentNotes.slice(0, 3).forEach(note => {
      activities.push({
        id: `note-${note.id}`,
        type: 'note',
        title: `Nouvelle note en ${note.matiere?.nom || 'Matière'}`,
        description: `${note.valeur}/20 - ${note.type}`,
        date: new Date(note.date_evaluation),
        urgent: note.valeur < 10
      });
    });

    // Ajouter les derniers bulletins
    this.recentBulletins.slice(0, 2).forEach(bulletin => {
      activities.push({
        id: `bulletin-${bulletin.id}`,
        type: 'bulletin',
        title: `Bulletin ${bulletin.periode?.nom || 'disponible'}`,
        description: `Moyenne: ${bulletin.moyenne_generale.toFixed(2)}/20`,
        date: new Date(bulletin.created_at),
        urgent: bulletin.moyenne_generale < 10
      });
    });

    // Trier par date
    this.recentActivities = activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }

  // ==================== MÉTHODES DE NAVIGATION ====================

  /**
   * ✅ CORRIGÉ: Naviguer vers les notes
   */
  naviguerVersNotes(): void {
    this.router.navigate(['/eleve/notes'])
      .catch(error => {
        console.error('Erreur navigation notes:', error);
        this.notificationService.error('Erreur', 'Impossible d\'accéder aux notes');
      });
  }

  /**
   * ✅ CORRIGÉ: Naviguer vers les bulletins
   */
  naviguerVersBulletins(): void {
    this.router.navigate(['/eleve/bulletins'])
      .catch(error => {
        console.error('Erreur navigation bulletins:', error);
        this.notificationService.error('Erreur', 'Impossible d\'accéder aux bulletins');
      });
  }

  /**
   * ✅ CORRIGÉ: Naviguer vers le profil
   */
  naviguerVersProfil(): void {
    this.router.navigate(['/eleve/profile'])
      .catch(error => {
        console.error('Erreur navigation profil:', error);
        this.notificationService.error('Erreur', 'Impossible d\'accéder au profil');
      });
  }

  /**
   * Voir les détails d'un bulletin
   */
  voirBulletinDetails(bulletin: Bulletin): void {
    this.router.navigate(['/eleve/bulletins', bulletin.id])
      .catch(error => {
        console.error('Erreur navigation bulletin:', error);
        this.notificationService.error('Erreur', 'Impossible d\'ouvrir le bulletin');
      });
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  /**
   * Calculer la mention selon la moyenne
   */
  private calculateMention(moyenne: number): string {
    if (moyenne >= 16) return 'Très bien';
    if (moyenne >= 14) return 'Bien';
    if (moyenne >= 12) return 'Assez bien';
    if (moyenne >= 10) return 'Passable';
    return 'Insuffisant';
  }

  /**
   * Obtenir l'étiquette de la mention
   */
  getMentionLabel(mention: string): string {
    return mention || 'Non évaluée';
  }

  /**
   * Obtenir la couleur de la moyenne
   */
  getMoyenneColor(moyenne: number): string {
    if (moyenne >= 15) return 'text-green-600';
    if (moyenne >= 12) return 'text-blue-600';
    if (moyenne >= 10) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Obtenir la couleur de la note
   */
  getNoteColor(note: number): string {
    if (note >= 16) return 'text-green-600';
    if (note >= 14) return 'text-blue-600';
    if (note >= 12) return 'text-yellow-600';
    if (note >= 10) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Formater une date
   */
  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR');
  }

  /**
   * Obtenir une salutation selon l'heure
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  /**
   * Obtenir le nom complet de l'utilisateur
   */
  getUserFullName(): string {
    if (!this.currentUser) return 'Utilisateur';
    return `${this.currentUser.prenom} ${this.currentUser.nom}`;
  }

  /**
   * Fermer le message de bienvenue
   */
  dismissWelcomeMessage(): void {
    this.showWelcomeMessage = false;
  }

  /**
   * Actualiser les données
   */
  refresh(): void {
    this.loadDashboardData();
  }

  /**
   * Gérer les clics sur les activités récentes
   */
  onActivityClick(activity: RecentActivity): void {
    switch (activity.type) {
      case 'note':
        this.naviguerVersNotes();
        break;
      case 'bulletin':
        this.naviguerVersBulletins();
        break;
      default:
        console.log('Type d\'activité non géré:', activity.type);
    }
  }
}