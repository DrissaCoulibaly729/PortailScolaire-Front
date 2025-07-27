// src/app/features/enseignant/classes/classe-detail/classe-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { EnseignantService, ClasseWithEffectif } from '../../../../core/services/enseignant.service';
import { Classe } from '../../../../shared/models/classe.model';
import { Eleve } from '../../../../shared/models/user.model';
// CORRECTION 1: Utiliser le bon import pour User
import { User } from '../../../../shared/models/auth.model';
import { Note } from '../../../../shared/models/note.model';

@Component({
  selector: 'app-classe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading && classe">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex justify-between items-start">
            <div class="flex items-center">
              <!-- CORRECTION 2: Utiliser navigateBack() au lieu de router.navigate() -->
              <button (click)="navigateBack()" 
                      class="text-gray-600 hover:text-gray-800 mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">{{ classe.nom }}</h1>
                <div class="flex items-center mt-2 space-x-4">
                  <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {{ classe.niveau }}
                  </span>
                  <span class="px-3 py-1 rounded-full text-sm font-medium"
                        [class]="classe.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ classe.actif ? 'Active' : 'Inactive' }}
                  </span>
                  <span class="text-gray-600">{{ getEffectif() }}/{{ classe.effectif_max || 0 }} élèves</span>
                </div>
              </div>
            </div>
            <div class="flex space-x-3">
              <!-- CORRECTION 3: Utiliser des méthodes publiques -->
              <button (click)="addNewNote()" 
                      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Nouvelle note
              </button>
              <button (click)="addBatchNotes()" 
                      class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Saisie en lot
              </button>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div *ngIf="classe.description" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 class="text-sm font-medium text-blue-900 mb-2">Description</h3>
          <p class="text-blue-800">{{ classe.description }}</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-blue-100">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Effectif</p>
                <p class="text-2xl font-bold text-gray-900">{{ getEffectif() }}</p>
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
                <p class="text-sm font-medium text-gray-600">Moyenne</p>
                <p class="text-2xl font-bold text-gray-900">{{ moyenneClasse | number:'1.2-2' }}/20</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-purple-100">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Notes saisies</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalNotes }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-orange-100">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Taux réussite</p>
                <p class="text-2xl font-bold text-gray-900">{{ tauxReussite | number:'1.0-0' }}%</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
          <!-- Tab Headers -->
          <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6" aria-label="Tabs">
              <button (click)="activeTab = 'eleves'" 
                      [class]="activeTab === 'eleves' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                      class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Liste des élèves
              </button>
              <button (click)="activeTab = 'notes'" 
                      [class]="activeTab === 'notes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                      class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Notes récentes
              </button>
              <button (click)="activeTab = 'stats'" 
                      [class]="activeTab === 'stats' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                      class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Statistiques
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <!-- Élèves Tab -->
            <div *ngIf="activeTab === 'eleves'">
              <div class="overflow-x-auto" *ngIf="eleves.length > 0; else noEleves">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élève</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro étudiant</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moyenne</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr *ngFor="let eleve of eleves; let i = index" class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-sm font-medium text-blue-800">
                              {{ eleve.nom?.charAt(0) }}{{ eleve.prenom?.charAt(0) }}
                            </span>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">{{ eleve.nom }} {{ eleve.prenom }}</div>
                            <div class="text-sm text-gray-500">{{ eleve.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ eleve.numero_etudiant }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <span class="text-sm font-medium" [class]="getMoyenneColorClass(eleve.moyenne_generale || 0)">
                            {{ eleve.moyenne_generale | number:'1.2-2' || 'N/A' }}/20
                          </span>
                          <span class="ml-2 px-2 py-1 text-xs rounded-full" [class]="getMentionClass(eleve.moyenne_generale || 0)">
                            {{ getMention(eleve.moyenne_generale || 0) }}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ eleve.rang_classe || (i + 1) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                          <button (click)="addNoteForEleve(eleve.id)" 
                                  class="text-blue-600 hover:text-blue-900">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                          </button>
                          <button (click)="viewEleveNotes(eleve.id)" 
                                  class="text-green-600 hover:text-green-900">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ng-template #noEleves>
                <div class="text-center py-12">
                  <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                  </svg>
                  <h3 class="text-lg font-medium text-gray-900">Aucun élève</h3>
                  <p class="text-gray-500 mt-1">Cette classe ne contient pas encore d'élèves.</p>
                </div>
              </ng-template>
            </div>

            <!-- Notes Tab -->
            <div *ngIf="activeTab === 'notes'">
              <div class="overflow-x-auto" *ngIf="recentNotes.length > 0; else noNotes">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élève</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr *ngFor="let note of recentNotes" class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                          {{ note.eleve?.nom }} {{ note.eleve?.prenom }}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ note.matiere?.nom }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-lg font-bold" [class]="getMoyenneColorClass(note.valeur)">
                          {{ note.valeur }}/20
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {{ note.type }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ note.date_evaluation | date:'dd/MM/yyyy' }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button (click)="editNote(note.id)" 
                                class="text-blue-600 hover:text-blue-900 mr-3">
                          Modifier
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ng-template #noNotes>
                <div class="text-center py-12">
                  <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <h3 class="text-lg font-medium text-gray-900">Aucune note</h3>
                  <p class="text-gray-500 mt-1">Aucune note n'a encore été saisie pour cette classe.</p>
                  <button (click)="addNewNote()" 
                          class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Ajouter une note
                  </button>
                </div>
              </ng-template>
            </div>

            <!-- Stats Tab -->
            <div *ngIf="activeTab === 'stats'">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Distribution des moyennes -->
                <div class="bg-gray-50 rounded-lg p-6">
                  <h4 class="text-lg font-medium text-gray-900 mb-4">Distribution des moyennes</h4>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Excellent (≥16)</span>
                      <span class="text-sm font-medium text-green-600">{{ getDistributionCount(16) }} élèves</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Très bien (14-16)</span>
                      <span class="text-sm font-medium text-blue-600">{{ getDistributionCount(14, 16) }} élèves</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Bien (12-14)</span>
                      <span class="text-sm font-medium text-yellow-600">{{ getDistributionCount(12, 14) }} élèves</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Assez bien (10-12)</span>
                      <span class="text-sm font-medium text-orange-600">{{ getDistributionCount(10, 12) }} élèves</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Insuffisant (&lt;10)</span>
                      <span class="text-sm font-medium text-red-600">{{ getDistributionCount(0, 10) }} élèves</span>
                    </div>
                  </div>
                </div>

                <!-- Informations générales -->
                <div class="bg-gray-50 rounded-lg p-6">
                  <h4 class="text-lg font-medium text-gray-900 mb-4">Informations générales</h4>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Niveau :</span>
                      <span class="text-sm font-medium text-gray-900">{{ classe.niveau }}</span>
                    </div>
                    <div class="flex justify-between" *ngIf="classe.section">
                      <span class="text-sm text-gray-600">Section :</span>
                      <span class="text-sm font-medium text-gray-900">{{ classe.section }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Effectif maximum :</span>
                      <span class="text-sm font-medium text-gray-900">{{ classe.effectif_max }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Taux d'occupation :</span>
                      <span class="text-sm font-medium text-gray-900">{{ getOccupationRate() }}%</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Statut :</span>
                      <span class="text-sm font-medium" [class]="classe.actif ? 'text-green-600' : 'text-red-600'">
                        {{ classe.actif ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class="text-sm font-medium text-red-800">Erreur de chargement</h3>
            <p class="text-sm text-red-700 mt-1">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClasseDetailComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  classe: ClasseWithEffectif | null = null;
  eleves: Eleve[] = [];
  recentNotes: Note[] = [];
  
  activeTab: 'eleves' | 'notes' | 'stats' = 'eleves';
  isLoading = false;
  errorMessage = '';
  
  // Stats calculées
  moyenneClasse = 0;
  totalNotes = 0;
  tauxReussite = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private enseignantService: EnseignantService,
    // CORRECTION 4: Rendre router public
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadClasseDetails();
    
    // Vérifier le fragment pour l'onglet actif
    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe(fragment => {
      if (fragment === 'eleves' || fragment === 'notes' || fragment === 'stats') {
        this.activeTab = fragment;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        // CORRECTION 5: Gestion des types User
        this.currentUser = user ? {
          ...user,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString()
        } : null;
      });
  }

  private loadClasseDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const classeId = +params['id'];
        
        // CORRECTION 6: Accès direct au BehaviorSubject et typage
        const classes = (this.enseignantService.classes$ as any).getValue() as ClasseWithEffectif[];
        this.classe = classes.find((c: ClasseWithEffectif) => c.id === classeId) || null;
        
        if (!this.classe) {
          throw new Error('Classe non trouvée');
        }

        // Charger les élèves de la classe
        return this.enseignantService.getElevesClasse(classeId);
      })
    ).subscribe({
      next: (eleves) => {
        this.eleves = eleves;
        this.calculateStats();
        this.loadRecentNotes();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = 'Impossible de charger les détails de la classe.';
        this.isLoading = false;
      }
    });
  }

  private loadRecentNotes(): void {
    if (!this.classe?.id || !this.currentUser?.id) return;

    const filters = {
      classe_id: this.classe.id,
      enseignant_id: this.currentUser.id,
      per_page: 10,
      sort_by: 'date_evaluation',
      sort_direction: 'desc' as const
    };

    this.enseignantService.getNotes(this.currentUser.id, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentNotes = response.data;
          // CORRECTION 7: Gestion de la propriété total
          this.totalNotes = (response as any).total || response.data.length;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notes:', error);
        }
      });
  }

  private calculateStats(): void {
    if (this.eleves.length === 0) return;

    // Calculer la moyenne de la classe
    const moyennes = this.eleves
      .map(e => e.moyenne_generale || 0)
      .filter(m => m > 0);
    
    if (moyennes.length > 0) {
      this.moyenneClasse = moyennes.reduce((sum, m) => sum + m, 0) / moyennes.length;
      this.tauxReussite = (moyennes.filter(m => m >= 10).length / moyennes.length) * 100;
    }
  }

  // CORRECTION 8: Méthodes publiques pour navigation
  navigateBack(): void {
    this.router.navigate(['/enseignant/classes']);
  }

  addNewNote(): void {
    this.router.navigate(['/enseignant/notes/new'], { 
      queryParams: { classe_id: this.classe?.id } 
    });
  }

  addBatchNotes(): void {
    this.router.navigate(['/enseignant/notes/batch'], { 
      queryParams: { classe_id: this.classe?.id } 
    });
  }

  getEffectif(): number {
    if (!this.classe) return 0;
    return (this.classe as any).effectif || this.classe.effectif || this.eleves.length;
  }

  getOccupationRate(): number {
    if (!this.classe?.effectif_max || this.classe.effectif_max === 0) return 0;
    const effectif = this.getEffectif();
    const rate = (effectif / this.classe.effectif_max) * 100;
    return Math.min(100, Math.round(rate));
  }

  getDistributionCount(min: number, max?: number): number {
    return this.eleves.filter(eleve => {
      const moyenne = eleve.moyenne_generale || 0;
      if (max !== undefined) {
        return moyenne >= min && moyenne < max;
      }
      return moyenne >= min;
    }).length;
  }

  getMoyenneColorClass(note: number): string {
    if (note >= 16) return 'text-green-600';
    if (note >= 14) return 'text-blue-600';
    if (note >= 12) return 'text-yellow-600';
    if (note >= 10) return 'text-orange-600';
    return 'text-red-600';
  }

  getMention(note: number): string {
    if (note >= 16) return 'Excellent';
    if (note >= 14) return 'Très Bien';
    if (note >= 12) return 'Bien';
    if (note >= 10) return 'Assez Bien';
    if (note >= 8) return 'Passable';
    return 'Insuffisant';
  }

  getMentionClass(note: number): string {
    if (note >= 16) return 'bg-green-100 text-green-800';
    if (note >= 14) return 'bg-blue-100 text-blue-800';
    if (note >= 12) return 'bg-yellow-100 text-yellow-800';
    if (note >= 10) return 'bg-orange-100 text-orange-800';
    if (note >= 8) return 'bg-red-100 text-red-800';
    return 'bg-red-200 text-red-900';
  }

  // Actions
  addNoteForEleve(eleveId: number): void {
    this.router.navigate(['/enseignant/notes/new'], {
      queryParams: {
        classe_id: this.classe?.id,
        eleve_id: eleveId
      }
    });
  }

  viewEleveNotes(eleveId: number): void {
    this.router.navigate(['/enseignant/notes'], {
      queryParams: {
        classe_id: this.classe?.id,
        eleve_id: eleveId
      }
    });
  }

  editNote(noteId: number): void {
    this.router.navigate(['/enseignant/notes/edit', noteId]);
  }
}