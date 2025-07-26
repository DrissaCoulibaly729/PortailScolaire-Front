// src/app/features/enseignant/classes/classe-list/classe-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../../shared/models/auth.model';

// Interfaces temporaires (à remplacer par les vrais modèles)
interface Classe {
  id: number;
  nom: string;
  niveau: string;
  effectif: number;
  effectif_max: number;
  moyenne_generale?: number;
  nb_notes_saisies?: number;
  derniere_note?: string;
  matiere?: string;
}

interface ClasseStatistiques {
  total_notes: number;
  moyenne_classe: number;
  meilleure_note: number;
  note_la_plus_basse: number;
  eleves_en_difficulte: number;
}

@Component({
  selector: 'app-classe-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Mes classes</h1>
            <p class="text-gray-600 mt-2">Gérez vos classes et suivez les performances</p>
          </div>
          <div class="flex space-x-3">
            <button (click)="exportClasses()" 
                    class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Exporter
            </button>
            <button routerLink="/enseignant/notes/create" 
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Saisir des notes
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques globales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-blue-100">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total classes</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalClasses }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-green-100">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total élèves</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalEleves }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-purple-100">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div class="p-2 rounded-lg bg-yellow-100">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Notes saisies</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalNotes }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div class="relative">
              <input type="text" 
                     formControlName="recherche"
                     placeholder="Nom de classe..."
                     class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
            <select formControlName="niveau" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Tous les niveaux</option>
              <option value="6ème">6ème</option>
              <option value="5ème">5ème</option>
              <option value="4ème">4ème</option>
              <option value="3ème">3ème</option>
              <option value="2nde">2nde</option>
              <option value="1ère">1ère</option>
              <option value="Terminale">Terminale</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
            <select formControlName="tri" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="nom">Nom de classe</option>
              <option value="niveau">Niveau</option>
              <option value="effectif">Effectif</option>
              <option value="moyenne">Moyenne</option>
            </select>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="bg-white rounded-lg shadow-sm p-8">
        <div class="flex justify-center items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600">Chargement des classes...</span>
        </div>
      </div>

      <!-- Liste des classes -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div *ngFor="let classe of classesFiltrees" 
             class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
             (click)="voirClasse(classe.id)">
          
          <!-- Header de la carte -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ classe.nom }}</h3>
                <p class="text-sm text-gray-500">{{ classe.niveau }} • {{ classe.matiere }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-green-100 text-green-800': classe.effectif <= classe.effectif_max * 0.8,
                        'bg-yellow-100 text-yellow-800': classe.effectif > classe.effectif_max * 0.8 && classe.effectif <= classe.effectif_max,
                        'bg-red-100 text-red-800': classe.effectif > classe.effectif_max
                      }">
                  {{ classe.effectif }}/{{ classe.effectif_max }}
                </span>
              </div>
            </div>
          </div>

          <!-- Statistiques -->
          <div class="p-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-600">Moyenne classe</p>
                <p class="text-xl font-bold"
                   [ngClass]="{
                     'text-green-600': classe.moyenne_generale && classe.moyenne_generale >= 16,
                     'text-blue-600': classe.moyenne_generale && classe.moyenne_generale >= 14 && classe.moyenne_generale < 16,
                     'text-yellow-600': classe.moyenne_generale && classe.moyenne_generale >= 12 && classe.moyenne_generale < 14,
                     'text-orange-600': classe.moyenne_generale && classe.moyenne_generale >= 10 && classe.moyenne_generale < 12,
                     'text-red-600': classe.moyenne_generale && classe.moyenne_generale < 10,
                     'text-gray-400': !classe.moyenne_generale
                   }">
                  {{ classe.moyenne_generale ? (classe.moyenne_generale | number:'1.2-2') + '/20' : 'N/A' }}
                </p>
              </div>

              <div>
                <p class="text-sm font-medium text-gray-600">Notes saisies</p>
                <p class="text-xl font-bold text-gray-900">{{ classe.nb_notes_saisies || 0 }}</p>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Dernière note :</span>
                <span class="text-gray-900">{{ classe.derniere_note ? (classe.derniere_note | date:'dd/MM/yyyy') : 'Aucune' }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button (click)="ajouterNote(classe.id); $event.stopPropagation()" 
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Ajouter une note
            </button>
            
            <div class="flex space-x-3">
              <button (click)="voirStatistiques(classe.id); $event.stopPropagation()" 
                      class="text-gray-500 hover:text-gray-700" 
                      title="Statistiques">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </button>
              
              <button (click)="voirClasse(classe.id); $event.stopPropagation()" 
                      class="text-gray-500 hover:text-gray-700" 
                      title="Voir détails">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="classesFiltrees.length === 0" class="col-span-full">
          <div class="text-center py-12">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune classe trouvée</h3>
            <p class="text-gray-500 mb-6">Aucune classe ne correspond aux critères de recherche.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClasseListComponent implements OnInit {
  currentUser: User | null = null;
  classes: Classe[] = [];
  classesFiltrees: Classe[] = [];
  isLoading = false;

  // Statistiques
  totalClasses = 0;
  totalEleves = 0;
  moyenneGenerale = 0;
  totalNotes = 0;

  // Filtres
  filterForm: FormGroup;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      recherche: [''],
      niveau: [''],
      tri: ['nom']
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadClasses();
    this.initializeFilters();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  private loadClasses(): void {
    this.isLoading = true;
    
    // Mock data for demo
    setTimeout(() => {
      this.classes = [
        {
          id: 1,
          nom: '6ème A',
          niveau: '6ème',
          effectif: 28,
          effectif_max: 30,
          moyenne_generale: 14.2,
          nb_notes_saisies: 145,
          derniere_note: '2024-01-20',
          matiere: 'Mathématiques'
        },
        {
          id: 2,
          nom: '5ème B',
          niveau: '5ème',
          effectif: 26,
          effectif_max: 28,
          moyenne_generale: 13.8,
          nb_notes_saisies: 132,
          derniere_note: '2024-01-18',
          matiere: 'Mathématiques'
        },
        {
          id: 3,
          nom: 'Terminale C',
          niveau: 'Terminale',
          effectif: 24,
          effectif_max: 25,
          moyenne_generale: 12.5,
          nb_notes_saisies: 98,
          derniere_note: '2024-01-15',
          matiere: 'Physique'
        }
      ];

      this.classesFiltrees = [...this.classes];
      this.calculateStatistics();
      this.isLoading = false;
    }, 1000);
  }

  private calculateStatistics(): void {
    this.totalClasses = this.classes.length;
    this.totalEleves = this.classes.reduce((sum, classe) => sum + classe.effectif, 0);
    this.totalNotes = this.classes.reduce((sum, classe) => sum + (classe.nb_notes_saisies || 0), 0);
    
    const moyennes = this.classes
      .filter(c => c.moyenne_generale)
      .map(c => c.moyenne_generale!);
    
    this.moyenneGenerale = moyennes.length > 0 
      ? moyennes.reduce((sum, moy) => sum + moy, 0) / moyennes.length 
      : 0;
  }

  private initializeFilters(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.appliquerFiltres();
    });
  }

  private appliquerFiltres(): void {
    const { recherche, niveau, tri } = this.filterForm.value;
    
    let resultats = [...this.classes];

    // Filtre recherche
    if (recherche) {
      resultats = resultats.filter(classe => 
        classe.nom.toLowerCase().includes(recherche.toLowerCase())
      );
    }

    // Filtre niveau
    if (niveau) {
      resultats = resultats.filter(classe => classe.niveau === niveau);
    }

    // Tri
    resultats.sort((a, b) => {
      switch (tri) {
        case 'nom':
          return a.nom.localeCompare(b.nom);
        case 'niveau':
          return a.niveau.localeCompare(b.niveau);
        case 'effectif':
          return b.effectif - a.effectif;
        case 'moyenne':
          return (b.moyenne_generale || 0) - (a.moyenne_generale || 0);
        default:
          return 0;
      }
    });

    this.classesFiltrees = resultats;
  }

  voirClasse(classeId: number): void {
    this.router.navigate(['/enseignant/classes', classeId]);
  }

  ajouterNote(classeId: number): void {
    this.router.navigate(['/enseignant/notes/create'], { 
      queryParams: { classe_id: classeId } 
    });
  }

  voirStatistiques(classeId: number): void {
    this.router.navigate(['/enseignant/statistiques'], { 
      queryParams: { classe_id: classeId } 
    });
  }

  exportClasses(): void {
    this.notificationService.info('Export', 'Fonctionnalité d\'export en cours de développement');
  }
}