import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../shared/models/auth.model';
import { 
  Bulletin, 
  getMentionLabel, 
  getMentionColor,
  formatNote, 
  StatutBulletin
} from '../../../shared/models/notes-bulletins.model';
import { NoteService } from '../../../core/services/note.service';
import { TypePeriode } from '../../../shared/models/note.model';

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
                <p class="text-xs text-gray-500" *ngIf="currentUser?.identifiant_genere">
                  ID: {{ currentUser?.identifiant_genere }}
                </p>
              </div>
              <button (click)="logout()" 
                      class="text-gray-400 hover:text-gray-600">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Welcome Section -->
        <div class="mb-8">
          <div class="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
            <h2 class="text-2xl font-bold mb-2">
              Bienvenue {{ currentUser?.prenom }} !
            </h2>
            <p class="text-green-100">
              Consultez vos bulletins de notes et suivez votre progression scolaire
            </p>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Moyenne générale</p>
                <p class="text-2xl font-bold text-gray-900">{{ moyenneGenerale | number:'1.2-2' }}/20</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Bulletins disponibles</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalBulletins }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Rang dans la classe</p>
                <p class="text-2xl font-bold text-gray-900">{{ rangClasse || '-' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <p class="text-red-800">{{ error }}</p>
          </div>
        </div>

        <!-- Bulletins List -->
        <div *ngIf="!isLoading && !error">
          <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Mes bulletins de notes</h3>
              <p class="text-sm text-gray-600 mt-1">Consultez et téléchargez vos bulletins par période</p>
            </div>

            <div *ngIf="bulletins.length === 0" class="p-12 text-center">
              <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun bulletin disponible</h3>
              <p class="text-gray-500">Vos bulletins apparaîtront ici dès qu'ils seront générés par l'administration.</p>
            </div>

            <div *ngIf="bulletins.length > 0" class="divide-y divide-gray-200">
              <div *ngFor="let bulletin of bulletins" class="p-6 hover:bg-gray-50 transition-colors">
                <div class="flex items-center justify-between">
                  <!-- Bulletin Info -->
                  <div class="flex-1">
                    <div class="flex items-center space-x-4">
                      <div class="p-3 bg-green-100 rounded-lg">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </div>
                      
                      <div class="flex-1">
                        <h4 class="text-lg font-semibold text-gray-900">
                          {{ bulletin.periode?.nom || 'Période inconnue' }}
                        </h4>
                        <p class="text-sm text-gray-600">
                          {{ bulletin.classe?.nom }} - {{ bulletin.classe?.niveau }}
                        </p>
                        <p class="text-xs text-gray-500 mt-1">
                          Généré le {{ bulletin.created_at | date:'dd/MM/yyyy à HH:mm' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Stats -->
                  <div class="flex items-center space-x-8">
                    <!-- Moyenne -->
                    <div class="text-center">
                      <p class="text-sm font-medium text-gray-600">Moyenne</p>
                      <p class="text-2xl font-bold" 
                         [ngClass]="{
                           'text-green-600': bulletin.moyenne_generale >= 12,
                           'text-yellow-600': bulletin.moyenne_generale >= 10 && bulletin.moyenne_generale < 12,
                           'text-red-600': bulletin.moyenne_generale < 10
                         }">
                        {{ formatNote(bulletin.moyenne_generale) }}/20
                      </p>
                    </div>

                    <!-- Mention -->
                    <div class="text-center">
                      <p class="text-sm font-medium text-gray-600">Mention</p>
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            [ngClass]="'bg-' + getMentionColor(bulletin.mention) + '-100 text-' + getMentionColor(bulletin.mention) + '-800'">
                        {{ getMentionLabel(bulletin.mention) }}
                      </span>
                    </div>

                    <!-- Rang -->
                    <div class="text-center" *ngIf="bulletin.rang_classe">
                      <p class="text-sm font-medium text-gray-600">Rang</p>
                      <p class="text-lg font-bold text-gray-900">
                        {{ bulletin.rang_classe }}{{ getOrdinalSuffix(bulletin.rang_classe) }}
                      </p>
                    </div>

                    <!-- Actions -->
                    <div class="flex space-x-2">
                      <button (click)="viewBulletin(bulletin)" 
                              class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        Consulter
                      </button>
                      
                      <button (click)="downloadBulletin(bulletin)" 
                              [disabled]="!bulletin.pdf_url"
                              class="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Observations générales - ✅ CORRIGÉ -->
                <div *ngIf="bulletin.observations_generales" class="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p class="text-sm font-medium text-blue-900 mb-1">Observations générales :</p>
                  <p class="text-sm text-blue-800">{{ bulletin.observations_generales }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 text-center">
          <p class="text-sm text-gray-500">
            Pour toute question concernant vos bulletins, contactez l'administration de l'établissement.
          </p>
        </div>
      </div>
    </div>
  `
})
export class EleveDashboardComponent implements OnInit {
  currentUser: User | null = null;
  bulletins: Bulletin[] = [];
  isLoading = false;
  error: string | null = null;

  // Stats
  moyenneGenerale = 0;
  totalBulletins = 0;
  rangClasse: number | null = null;
  totalEleves: number | null = null;
  mention: string = '';

  constructor(
    private authService: AuthService,
    private noteService: NoteService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadBulletins();
  }

  /**
   * Load current user
   */
  private loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Load bulletins for current user
   */
  private loadBulletins(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.error = null;

    // Mock data for demo
    this.loadMockBulletins();
  }

  /**
   * Load mock bulletins for demonstration - ✅ CORRIGÉ avec observations_generales
   */
  private loadMockBulletins(): void {
    this.bulletins = [
      {
        id: 1,
        eleve_id: 1,
        classe_id: 1,
        periode_id: 1,
        annee_scolaire: '2023-2024',
        moyenne_generale: 14.5,
        rang_classe: 5,
        total_eleves: 28,
        mention: 'Bien',
        statut: 'publie' as StatutBulletin,
        pdf_url: '/assets/bulletins/bulletin_1.pdf',
        observations_generales: 'Bon trimestre dans l\'ensemble. L\'élève fait preuve de sérieux et d\'assiduité. Quelques efforts à fournir en mathématiques pour améliorer la moyenne générale.', // ✅ Ajouté
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:00:00Z',
        periode: {
          id: 1,
          nom: '1er Trimestre',
          type: 'trimestre1' as TypePeriode,
          date_debut: '2023-09-01',
          date_fin: '2023-12-20',
          actif: false,
          annee_scolaire: '2023-2024',
          created_at: '2023-09-01T08:00:00Z',
          updated_at: '2023-09-01T08:00:00Z'
        },
        classe: {
          id: 1,
          nom: '6ème A',
          niveau: '6ème',
          section: 'A',
          effectif_max: 30,
          moyenne: 13.8,
          actif: true,
          created_at: '2023-09-01T08:00:00Z',
          updated_at: '2023-09-01T08:00:00Z'
        }
      },
      {
        id: 2,
        eleve_id: 1,
        classe_id: 1,
        periode_id: 2,
        annee_scolaire: '2023-2024',
        moyenne_generale: 15.2,
        rang_classe: 3,
        total_eleves: 28,
        mention: 'Bien',
        statut: 'publie' as StatutBulletin,
        pdf_url: '/assets/bulletins/bulletin_2.pdf',
        observations_generales: 'Très bon trimestre ! L\'élève a progressé dans toutes les matières. Les efforts fournis portent leurs fruits. Continuez sur cette excellente lancée.', // ✅ Ajouté
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:00:00Z',
        periode: {
          id: 2,
          nom: '2ème Trimestre',
          type: 'trimestre2' as TypePeriode,
          date_debut: '2024-01-01',
          date_fin: '2024-03-20',
          actif: true,
          annee_scolaire: '2023-2024',
          created_at: '2024-01-01T08:00:00Z',
          updated_at: '2024-01-01T08:00:00Z'
        },
        classe: {
          id: 1,
          nom: '6ème A',
          niveau: '6ème',
          section: 'A',
          effectif_max: 30,
          moyenne: 14.1,
          actif: true,
          created_at: '2023-09-01T08:00:00Z',
          updated_at: '2023-09-01T08:00:00Z'
        }
      }
    ];

    // Update stats
    this.totalBulletins = this.bulletins.length;
    this.loadUserStats();
    this.isLoading = false;
  }

  /**
   * Load user statistics from latest bulletin
   */
  private loadUserStats(): void {
    if (this.bulletins && this.bulletins.length > 0) {
      const dernierBulletin = this.bulletins[0];
      this.moyenneGenerale = dernierBulletin.moyenne_generale;
      this.rangClasse = dernierBulletin.rang_classe || null;
      this.totalEleves = dernierBulletin.total_eleves || null;
      this.mention = dernierBulletin.mention;
    }
  }

  /**
   * View bulletin details
   */
  viewBulletin(bulletin: Bulletin): void {
    // Navigate to bulletin detail view
    console.log('View bulletin:', bulletin);
    // this.router.navigate(['/eleve/bulletins', bulletin.id]);
  }

  /**
   * Download bulletin PDF
   */
  downloadBulletin(bulletin: Bulletin): void {
    if (!bulletin.pdf_url) {
      this.notificationService.warning('PDF non disponible', 'Le bulletin n\'est pas encore généré en PDF');
      return;
    }

    const link = document.createElement('a');
    link.href = bulletin.pdf_url;
    link.download = this.generateBulletinFilename(bulletin);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Téléchargement', 'Le bulletin a été téléchargé avec succès');
  }

  /**
   * Generate filename for bulletin download
   */
  generateBulletinFilename(bulletin: Bulletin): string {
    const periodeName = bulletin.periode?.nom?.replace(/\s+/g, '_') || 'bulletin';
    const className = bulletin.classe?.nom?.replace(/\s+/g, '_') || 'classe';
    const year = bulletin.annee_scolaire || '2023-2024';
    
    return `bulletin_${periodeName}_${className}_${year}.pdf`;
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
        this.router.navigate(['/auth/login']);
      }
    });
  }

  /**
   * Format note with comma separator
   */
  formatNote(note: number): string {
    return formatNote(note);
  }

  /**
   * Get mention label
   */
  getMentionLabel(mention: any): string {
    return getMentionLabel(mention);
  }

  /**
   * Get mention color
   */
  getMentionColor(mention: any): string {
    return getMentionColor(mention);
  }

  /**
   * Get ordinal suffix for ranking
   */
  getOrdinalSuffix(rang: number): string {
    if (rang === 1) return 'er';
    return 'ème';
  }
}