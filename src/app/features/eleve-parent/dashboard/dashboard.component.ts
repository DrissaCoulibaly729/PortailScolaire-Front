// src/app/features/eleve-parent/dashboard/dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

// FIX: Importer directement depuis les bons fichiers au lieu de notes-bulletins.model
import { User } from '../../../shared/models/auth.model';
import { 
  Bulletin, 
  StatutBulletin,
  getMentionFromMoyenne,
  getMentionLabel, 
  getMentionColor
} from '../../../shared/models/bulletin.model';

import { 
  Note,
  TypePeriode,
  formatNote 
} from '../../../shared/models/note.model';

import { NoteService } from '../../../core/services/note.service';

@Component({
  selector: 'app-eleve-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <h1 class="text-xl font-semibold text-gray-900">Portail Élève</h1>
              </div>
            </div>
            
            <!-- User Info -->
            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900" *ngIf="currentUser">
                  {{ currentUser?.nom }} {{ currentUser?.prenom }}
                </p>
                <p class="text-xs text-gray-500" *ngIf="currentUser">
                  Élève
                </p>
              </div>
              <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-blue-600">
                  {{ getUserInitials() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Chargement...</span>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Erreur</h3>
              <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading && !error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Welcome Message -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">
            Bonjour {{ currentUser?.prenom }} !
          </h2>
          <p class="text-gray-600 mt-1">
            Voici un aperçu de vos résultats scolaires
          </p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-blue-100">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Bulletins</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalBulletins }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-green-100">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Moyenne générale</p>
                <p class="text-2xl font-bold text-gray-900">{{ formatNote(moyenneGenerale) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-yellow-100">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Mention</p>
                <p class="text-lg font-bold text-gray-900">{{ getMentionLabel(mentionActuelle) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-purple-100">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Rang classe</p>
                <p class="text-2xl font-bold text-gray-900">{{ rangClasse || '-' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Bulletins -->
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Mes bulletins récents</h3>
            <button 
              routerLink="/eleve/bulletins"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Voir tous →
            </button>
          </div>

          <div *ngIf="recentBulletins.length === 0" class="text-center py-8">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun bulletin disponible</h3>
            <p class="text-gray-600">Vos bulletins apparaîtront ici dès qu'ils seront publiés.</p>
          </div>

          <div *ngIf="recentBulletins.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let bulletin of recentBulletins" 
                 class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                 (click)="viewBulletin(bulletin.id)">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-gray-900">
                  {{ bulletin.periode?.nom || 'Période' }}
                </span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="getBulletinStatusClass(bulletin.statut)">
                  {{ getBulletinStatusLabel(bulletin.statut) }}
                </span>
              </div>
              
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600">Moyenne générale</span>
                  <span class="text-sm font-medium text-gray-900">
                    {{ formatNote(bulletin.moyenne_generale) }}/20
                  </span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600">Mention</span>
                  <span class="text-sm font-medium"
                        [ngClass]="'text-' + getMentionColor(bulletin.mention) + '-600'">
                    {{ getMentionLabel(bulletin.mention) }}
                  </span>
                </div>
                
                <div *ngIf="bulletin.rang_classe" class="flex justify-between">
                  <span class="text-sm text-gray-600">Rang</span>
                  <span class="text-sm font-medium text-gray-900">
                    {{ bulletin.rang_classe }}/{{ bulletin.total_eleves }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <button 
              routerLink="/eleve/bulletins"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="p-2 bg-blue-100 rounded-lg">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="ml-3">
                <p class="font-medium text-gray-900">Mes bulletins</p>
                <p class="text-sm text-gray-600">Consulter tous mes bulletins</p>
              </div>
            </button>

            <button 
              (click)="downloadLatestBulletin()"
              [disabled]="!hasLatestBulletin()"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <div class="p-2 bg-green-100 rounded-lg">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="ml-3">
                <p class="font-medium text-gray-900">Télécharger</p>
                <p class="text-sm text-gray-600">Dernier bulletin PDF</p>
              </div>
            </button>

            <button 
              routerLink="/eleve/profile"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="p-2 bg-purple-100 rounded-lg">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div class="ml-3">
                <p class="font-medium text-gray-900">Mon profil</p>
                <p class="text-sm text-gray-600">Informations personnelles</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class EleveDashboardComponent implements OnInit {
  // État du composant
  isLoading = true;
  error: string | null = null;
  
  // Données utilisateur
  currentUser: User | null = null;
  
  // Statistiques
  totalBulletins = 0;
  moyenneGenerale = 0;
  mentionActuelle = '';
  rangClasse: number | null = null;
  
  // Bulletins récents
  recentBulletins: Bulletin[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
    // FIX: Retirer l'injection de NoteService qui causait l'erreur
    // private noteService: NoteService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Charger les données du dashboard
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // FIX: Utiliser la méthode synchrone getCurrentUser
    const user = this.authService.getCurrentUser();
    
    if (user && user.role === 'eleve') {
      this.currentUser = user;
      this.loadEleveData();
    } else {
      this.error = 'Accès non autorisé';
      this.isLoading = false;
    }
  }

  /**
   * Charger les données spécifiques à l'élève
   */
  private loadEleveData(): void {
    if (!this.currentUser) return;

    // Pour l'instant, on utilise des données simulées
    // Plus tard, vous pourrez les remplacer par de vrais appels API
    this.loadMockData();
  }

  /**
   * Charger des données simulées (temporaire)
   */
  private loadMockData(): void {
    // Simuler un délai de chargement
    setTimeout(() => {
      this.totalBulletins = 3;
      this.moyenneGenerale = 14.25;
      this.mentionActuelle = getMentionFromMoyenne(this.moyenneGenerale);
      this.rangClasse = 8;
      
      // Bulletins simulés
      this.recentBulletins = [
        {
          id: 1,
          eleve_id: this.currentUser!.id,
          classe_id: 1,
          periode_id: 1,
          annee_scolaire: '2024-2025',
          moyenne_generale: 14.25,
          rang_classe: 8,
          total_eleves: 28,
          mention: this.mentionActuelle,
          statut: 'publie' as StatutBulletin,
          periode: {
            id: 1,
            nom: '1er Trimestre',
            type: 'trimestre1' as TypePeriode,
            date_debut: '2024-09-01',
            date_fin: '2024-12-20',
            actif: true,
            annee_scolaire: '2024-2025',
            created_at: '2024-09-01',
            updated_at: '2024-09-01'
          },
          created_at: '2024-12-20',
          updated_at: '2024-12-20'
        }
      ];
      
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Obtenir les initiales de l'utilisateur
   */
  getUserInitials(): string {
    if (!this.currentUser) return '??';
    const firstInitial = this.currentUser.prenom?.charAt(0).toUpperCase() || '';
    const lastInitial = this.currentUser.nom?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Voir un bulletin spécifique
   */
  viewBulletin(bulletinId: number): void {
    this.router.navigate(['/eleve/bulletins', bulletinId]);
  }

  /**
   * Télécharger le dernier bulletin
   */
  downloadLatestBulletin(): void {
    if (this.recentBulletins.length > 0) {
      const latestBulletin = this.recentBulletins[0];
      // Ici vous pouvez implémenter le téléchargement PDF
      this.notificationService.info('Téléchargement', 'Fonctionnalité en cours de développement');
    }
  }

  /**
   * Vérifier si un bulletin récent est disponible
   */
  hasLatestBulletin(): boolean {
    return this.recentBulletins.length > 0;
  }

  /**
   * Obtenir la classe CSS pour le statut du bulletin
   */
  getBulletinStatusClass(statut: StatutBulletin): string {
    const classes = {
      'brouillon': 'bg-gray-100 text-gray-800',
      'publie': 'bg-green-100 text-green-800',
      'archive': 'bg-blue-100 text-blue-800'
    };
    return classes[statut] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtenir le label du statut du bulletin
   */
  getBulletinStatusLabel(statut: StatutBulletin): string {
    const labels = {
      'brouillon': 'Brouillon',
      'publie': 'Publié',
      'archive': 'Archivé'
    };
    return labels[statut] || statut;
  }

  // Exposer les fonctions utilitaires pour le template
  getMentionLabel = getMentionLabel;
  getMentionColor = getMentionColor;
  formatNote = formatNote;
}