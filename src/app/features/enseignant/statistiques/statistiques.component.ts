// src/app/features/enseignant/statistiques/statistiques.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../shared/models/auth.model';

// Interfaces pour les statistiques
interface StatistiquesGenerales {
  total_notes: number;
  moyenne_generale: number;
  notes_ce_mois: number;
  evolution_mois: number;
  repartition_mentions: MentionStat[];
}

interface MentionStat {
  mention: string;
  nombre: number;
  pourcentage: number;
  couleur: string;
}

interface PerformanceClasse {
  classe_id: number;
  classe_nom: string;
  moyenne: number;
  evolution: number;
  nb_eleves: number;
  nb_notes: number;
}

interface EvolutionNote {
  date: string;
  moyenne: number;
  nombre_notes: number;
}

interface StatistiqueMatiere {
  matiere: string;
  moyenne: number;
  nb_notes: number;
  meilleure_note: number;
  note_la_plus_basse: number;
  ecart_type: number;
}

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Statistiques</h1>
            <p class="text-gray-600 mt-2">Analyse des performances de vos classes</p>
          </div>
          <div class="flex space-x-3">
            <button (click)="exportStatistiques()" 
                    class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Exporter rapport
            </button>
            <button routerLink="/enseignant/dashboard" 
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
              </svg>
              Retour tableau de bord
            </button>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Période</label>
            <select formControlName="periode" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="mois">Ce mois</option>
              <option value="trimestre">Ce trimestre</option>
              <option value="semestre">Ce semestre</option>
              <option value="annee">Cette année</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Classe</label>
            <select formControlName="classe_id" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Toutes les classes</option>
              <option *ngFor="let classe of classes" [value]="classe.id">{{ classe.nom }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Matière</label>
            <select formControlName="matiere_id" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Toutes les matières</option>
              <option *ngFor="let matiere of matieres" [value]="matiere.id">{{ matiere.nom }}</option>
            </select>
          </div>

          <div class="flex items-end">
            <button (click)="actualiserStatistiques()" 
                    class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Actualiser
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="bg-white rounded-lg shadow-sm p-8">
        <div class="flex justify-center items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600">Calcul des statistiques...</span>
        </div>
      </div>

      <!-- Statistiques principales -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-blue-100">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total notes</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistiquesGenerales.total_notes }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-green-100">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Moyenne générale</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistiquesGenerales.moyenne_generale | number:'1.2-2' }}/20</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-yellow-100">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Notes ce mois</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistiquesGenerales.notes_ce_mois }}</p>
              <p class="text-xs" 
                 [ngClass]="{
                   'text-green-600': statistiquesGenerales.evolution_mois > 0,
                   'text-red-600': statistiquesGenerales.evolution_mois < 0,
                   'text-gray-500': statistiquesGenerales.evolution_mois === 0
                 }">
                {{ statistiquesGenerales.evolution_mois > 0 ? '+' : '' }}{{ statistiquesGenerales.evolution_mois }}% vs mois dernier
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-purple-100">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Progression</p>
              <p class="text-2xl font-bold text-green-600">+2.3%</p>
              <p class="text-xs text-gray-500">vs période précédente</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques et analyses -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Répartition des mentions -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Répartition des mentions</h3>
          <div class="space-y-4">
            <div *ngFor="let mention of statistiquesGenerales.repartition_mentions" 
                 class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-4 h-4 rounded-full mr-3" [style.background-color]="mention.couleur"></div>
                <span class="text-sm font-medium text-gray-700">{{ mention.mention }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500">{{ mention.nombre }}</span>
                <div class="w-24 bg-gray-200 rounded-full h-2">
                  <div class="h-2 rounded-full" 
                       [style.width.%]="mention.pourcentage"
                       [style.background-color]="mention.couleur"></div>
                </div>
                <span class="text-sm font-medium text-gray-900 w-10 text-right">{{ mention.pourcentage }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance par classe -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Performance par classe</h3>
          <div class="space-y-4">
            <div *ngFor="let classe of performanceClasses" 
                 class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">{{ classe.classe_nom }}</p>
                <p class="text-sm text-gray-500">{{ classe.nb_eleves }} élèves • {{ classe.nb_notes }} notes</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold"
                   [ngClass]="{
                     'text-green-600': classe.moyenne >= 16,
                     'text-blue-600': classe.moyenne >= 14 && classe.moyenne < 16,
                     'text-yellow-600': classe.moyenne >= 12 && classe.moyenne < 14,
                     'text-orange-600': classe.moyenne >= 10 && classe.moyenne < 12,
                     'text-red-600': classe.moyenne < 10
                   }">
                  {{ classe.moyenne | number:'1.2-2' }}/20
                </p>
                <p class="text-xs"
                   [ngClass]="{
                     'text-green-600': classe.evolution > 0,
                     'text-red-600': classe.evolution < 0,
                     'text-gray-500': classe.evolution === 0
                   }">
                  {{ classe.evolution > 0 ? '+' : '' }}{{ classe.evolution | number:'1.1-1' }}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Évolution temporelle -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Évolution des moyennes</h3>
        
        <!-- Graphique simple avec CSS -->
        <div class="h-64 flex items-end justify-between space-x-2">
          <div *ngFor="let point of evolutionNotes; let i = index" 
               class="flex flex-col items-center flex-1">
            <div class="bg-blue-500 rounded-t w-full relative hover:bg-blue-600 transition-colors cursor-pointer"
                 [style.height.%]="(point.moyenne / 20) * 100"
                 [title]="'Moyenne: ' + (point.moyenne | number:'1.2-2') + '/20'">
            </div>
            <p class="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
              {{ point.date | date:'dd/MM' }}
            </p>
          </div>
        </div>
        
        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600">Évolution des moyennes sur les 30 derniers jours</p>
        </div>
      </div>

      <!-- Statistiques par matière -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Analyse par matière</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moyenne</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min/Max</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Écart-type</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let stat of statistiquesMatieres">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ stat.matiere }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm"
                    [ngClass]="{
                      'text-green-600': stat.moyenne >= 16,
                      'text-blue-600': stat.moyenne >= 14 && stat.moyenne < 16,
                      'text-yellow-600': stat.moyenne >= 12 && stat.moyenne < 14,
                      'text-orange-600': stat.moyenne >= 10 && stat.moyenne < 12,
                      'text-red-600': stat.moyenne < 10
                    }">
                  {{ stat.moyenne | number:'1.2-2' }}/20
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ stat.nb_notes }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ stat.note_la_plus_basse | number:'1.1-1' }} - {{ stat.meilleure_note | number:'1.1-1' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ stat.ecart_type | number:'1.2-2' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class StatistiquesComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = false;

  // Données
  statistiquesGenerales: StatistiquesGenerales = {
    total_notes: 0,
    moyenne_generale: 0,
    notes_ce_mois: 0,
    evolution_mois: 0,
    repartition_mentions: []
  };

  performanceClasses: PerformanceClasse[] = [];
  evolutionNotes: EvolutionNote[] = [];
  statistiquesMatieres: StatistiqueMatiere[] = [];

  // Options
  classes: any[] = [];
  matieres: any[] = [];

  // Filtres
  filterForm: FormGroup;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      periode: ['mois'],
      classe_id: [''],
      matiere_id: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadOptions();
    this.loadStatistiques();
    this.initializeFilters();
    this.checkRouteParams();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  private checkRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['classe_id']) {
        this.filterForm.patchValue({ classe_id: params['classe_id'] });
      }
    });
  }

  private loadOptions(): void {
    // Mock data
    this.classes = [
      { id: 1, nom: '6ème A' },
      { id: 2, nom: '5ème B' },
      { id: 3, nom: 'Terminale C' }
    ];

    this.matieres = [
      { id: 1, nom: 'Mathématiques' },
      { id: 2, nom: 'Physique' },
      { id: 3, nom: 'Français' }
    ];
  }

  private loadStatistiques(): void {
    this.isLoading = true;

    // Mock data
    setTimeout(() => {
      this.statistiquesGenerales = {
        total_notes: 347,
        moyenne_generale: 13.8,
        notes_ce_mois: 89,
        evolution_mois: 12.5,
        repartition_mentions: [
          { mention: 'Très bien', nombre: 45, pourcentage: 13, couleur: '#10b981' },
          { mention: 'Bien', nombre: 78, pourcentage: 22, couleur: '#3b82f6' },
          { mention: 'Assez bien', nombre: 124, pourcentage: 36, couleur: '#f59e0b' },
          { mention: 'Passable', nombre: 67, pourcentage: 19, couleur: '#f97316' },
          { mention: 'Insuffisant', nombre: 33, pourcentage: 10, couleur: '#ef4444' }
        ]
      };

      this.performanceClasses = [
        { classe_id: 1, classe_nom: '6ème A', moyenne: 14.2, evolution: 2.1, nb_eleves: 28, nb_notes: 145 },
        { classe_id: 2, classe_nom: '5ème B', moyenne: 13.8, evolution: -0.5, nb_eleves: 26, nb_notes: 132 },
        { classe_id: 3, classe_nom: 'Terminale C', moyenne: 12.5, evolution: 1.8, nb_eleves: 24, nb_notes: 98 }
      ];

      this.evolutionNotes = [
        { date: '2024-01-01', moyenne: 13.2, nombre_notes: 12 },
        { date: '2024-01-03', moyenne: 13.5, nombre_notes: 18 },
        { date: '2024-01-05', moyenne: 14.1, nombre_notes: 25 },
        { date: '2024-01-08', moyenne: 13.8, nombre_notes: 15 },
        { date: '2024-01-10', moyenne: 14.3, nombre_notes: 22 },
        { date: '2024-01-12', moyenne: 13.9, nombre_notes: 19 },
        { date: '2024-01-15', moyenne: 14.5, nombre_notes: 28 }
      ];

      this.statistiquesMatieres = [
        { matiere: 'Mathématiques', moyenne: 14.2, nb_notes: 198, meilleure_note: 19.5, note_la_plus_basse: 4.5, ecart_type: 3.2 },
        { matiere: 'Physique', moyenne: 13.1, nb_notes: 89, meilleure_note: 18.0, note_la_plus_basse: 6.0, ecart_type: 2.8 },
        { matiere: 'Français', moyenne: 12.8, nb_notes: 60, meilleure_note: 17.5, note_la_plus_basse: 5.5, ecart_type: 3.1 }
      ];

      this.isLoading = false;
    }, 1500);
  }

  private initializeFilters(): void {
    this.filterForm.valueChanges.subscribe(() => {
      // Dans une vraie application, on rechargerait les données
      console.log('Filtres changés:', this.filterForm.value);
    });
  }

  actualiserStatistiques(): void {
    this.loadStatistiques();
    this.notificationService.success('Statistiques actualisées', 'Les données ont été mises à jour');
  }

  exportStatistiques(): void {
    this.notificationService.info('Export', 'Génération du rapport en cours...');
    
    // Simulation d'export
    setTimeout(() => {
      this.notificationService.success('Export terminé', 'Le rapport a été téléchargé');
    }, 2000);
  }
}