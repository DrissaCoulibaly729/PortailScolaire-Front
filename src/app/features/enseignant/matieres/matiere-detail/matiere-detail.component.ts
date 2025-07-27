// src/app/features/enseignant/matieres/matiere-detail/matiere-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { EnseignantService } from '../../../../core/services/enseignant.service';
import { Matiere } from '../../../../shared/models/matiere.model';
import { Classe } from '../../../../shared/models/classe.model';
import { Note } from '../../../../shared/models/note.model';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-matiere-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading && matiere">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex justify-between items-start">
            <div class="flex items-center">
              <button (click)="router.navigate(['/enseignant/matieres'])" 
                      class="text-gray-600 hover:text-gray-800 mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">{{ matiere.nom }}</h1>
                <div class="flex items-center mt-2 space-x-4">
                  <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {{ matiere.code }}
                  </span>
                  <span class="px-3 py-1 rounded-full text-sm font-medium"
                        [class]="matiere.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ matiere.active ? 'Active' : 'Inactive' }}
                  </span>
                  <span class="text-gray-600">Coefficient {{ matiere.coefficient }}</span>
                </div>
              </div>
            </div>
            <div class="flex space-x-3">
              <button (click)="router.navigate(['/enseignant/notes/new'], { queryParams: { matiere_id: matiere.id } })" 
                      class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Nouvelle note
              </button>
              <button (click)="router.navigate(['/enseignant/notes/batch'], { queryParams: { matiere_id: matiere.id } })" 
                      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Saisie en lot
              </button>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div *ngIf="matiere.description" class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 class="text-sm font-medium text-purple-900 mb-2">Description</h3>
          <p class="text-purple-800">{{ matiere.description }}</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-purple-100">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Classes</p>
                <p class="text-2xl font-bold text-gray-900">{{ classes.length }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex items-center">
              <div class="p-2 rounded-lg bg-blue-100">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
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
              <div class="p-2 rounded-lg bg-green-100">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div class="p-2 rounded-lg bg-orange-100">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Notes saisies</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalNotes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
          <!-- Tab Headers -->
          <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6" aria-label="Tabs">
              <button (click)="activeTab = 'classes'" 
                      [class]="activeTab === 'classes' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                      class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Classes enseignées
              </button>
              <button (click)="activeTab = 'notes'" 
                      [class]="activeTab === 'notes' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                      class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Notes récentes
              </button>
              <button (click)="activeTab = 'stats'" 
                      [class]="activeTab === 'stats' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                      class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Statistiques
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <!-- Classes Tab -->
            <div *ngIf="activeTab === 'classes'">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="classes.length > 0; else noClasses">
                <div *ngFor="let classe of classes" 
                     class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                     (click)="router.navigate(['/enseignant/classes', classe.id])">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                      <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span class="text-sm font-medium text-blue-600">{{ classe.nom.charAt(0) }}</span>
                      </div>
                      <div class="ml-3">
                        <h4 class="text-lg font-medium text-gray-900">{{ classe.nom }}</h4>
                        <p class="text-sm text-gray-600">{{ classe.niveau }}</p>
                      </div>
                    </div>
                    <div class="w-3 h-3 rounded-full" 
                         [class]="classe.actif ? 'bg-green-400' : 'bg-red-400'"></div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="text-center">
                      <div class="text-xl font-bold text-gray-900">{{ classe.effectif_actuel || 0 }}</div>
                      <div class="text-xs text-gray-600">Élèves</div>
                    </div>
                    <div class="text-center">
                      <div class="text-xl font-bold text-purple-600">{{ getMoyenneClasse(classe.id) | number:'1.1-1' }}</div>
                      <div class="text-xs text-gray-600">Moyenne</div>
                    </div>
                  </div>

                  <div class="flex justify-between items-center">
                    <button (click)="viewClasseNotes(classe.id, $event)" 
                            class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                      Voir les notes
                    </button>
                    <button (click)="addNoteForClasse(classe.id, $event)" 
                            class="text-green-600 hover:text-green-800 text-sm font-medium">
                      Nouvelle note
                    </button>
                  </div>
                </div>
              </div>

              <ng-template #noClasses>
                <div class="text-center py-12">
                  <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
                  </svg>
                  <h3 class="text-lg font-medium text-gray-900">Aucune classe</h3>
                  <p class="text-gray-500 mt-1">Cette matière n'est enseignée dans aucune classe.</p>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr *ngFor="let note of recentNotes" class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-xs font-medium text-blue-800">
                              {{ note.eleve?.nom?.charAt(0) }}{{ note.eleve?.prenom?.charAt(0) }}
                            </span>
                          </div>
                          <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">
                              {{ note.eleve?.nom }} {{ note.eleve?.prenom }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ getClasseName(note.classe_id) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <span class="text-lg font-bold" [class]="getNoteColorClass(note.valeur)">
                            {{ note.valeur }}/20
                          </span>
                          <span class="ml-2 px-2 py-1 text-xs rounded-full" [class]="getMentionClass(note.valeur)">
                            {{ getMention(note.valeur) }}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {{ note.type }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ note.date_evaluation | date:'dd/MM/yyyy' }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button (click)="editNote(note.id)" 
                                class="text-purple-600 hover:text-purple-900">
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
                  <p class="text-gray-500 mt-1">Aucune note n'a encore été saisie pour cette matière.</p>
                  <button (click)="router.navigate(['/enseignant/notes/new'], { queryParams: { matiere_id: matiere.id } })" 
                          class="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    Ajouter une note
                  </button>
                </div>
              </ng-template>
            </div>

            <!-- Stats Tab -->
            <div *ngIf="activeTab === 'stats'">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Distribution des notes -->
                <div class="bg-gray-50 rounded-lg p-6">
                  <h4 class="text-lg font-medium text-gray-900 mb-4">Distribution des notes</h4>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Excellent (≥16)</span>
                      <span class="text-sm font-medium text-green-600">{{ getDistributionCount(16) }} notes</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Très bien (14-16)</span>
                      <span class="text-sm font-medium text-blue-600">{{ getDistributionCount(14, 16) }} notes</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Bien (12-14)</span>
                      <span class="text-sm font-medium text-yellow-600">{{ getDistributionCount(12, 14) }} notes</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Assez bien (10-12)</span>
                      <span class="text-sm font-medium text-orange-600">{{ getDistributionCount(10, 12) }} notes</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Insuffisant (&lt;10)</span>
                      <span class="text-sm font-medium text-red-600">{{ getDistributionCount(0, 10) }} notes</span>
                    </div>
                  </div>
                </div>

                <!-- Informations sur la matière -->
                <div class="bg-gray-50 rounded-lg p-6">
                  <h4 class="text-lg font-medium text-gray-900 mb-4">Informations de la matière</h4>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Code matière :</span>
                      <span class="text-sm font-medium text-gray-900">{{ matiere.code }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Coefficient :</span>
                      <span class="text-sm font-medium text-gray-900">{{ matiere.coefficient }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Classes enseignées :</span>
                      <span class="text-sm font-medium text-gray-900">{{ classes.length }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Total élèves :</span>
                      <span class="text-sm font-medium text-gray-900">{{ totalEleves }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">Statut :</span>
                      <span class="text-sm font-medium" [class]="matiere.active ? 'text-green-600' : 'text-red-600'">
                        {{ matiere.active ? 'Active' : 'Inactive' }}
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
export class MatiereDetailComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  matiere: Matiere | null = null;
  classes: Classe[] = [];
  recentNotes: Note[] = [];
  
  activeTab: 'classes' | 'notes' | 'stats' = 'classes';
  isLoading = false;
  errorMessage = '';
  
  // Stats calculées
  moyenneGenerale = 0;
  totalNotes = 0;
  totalEleves = 0;
  
  // Cache pour les moyennes par classe
  private moyennesParClasse: { [key: number]: number } = {};
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private enseignantService: EnseignantService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadMatiereDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  private loadMatiereDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const matiereId = +params['id'];
        
        // Charger les détails de la matière depuis le cache ou l'API
        const matieres = this.enseignantService.matieres$.getValue();
        this.matiere = matieres.find(m => m.id === matiereId) || null;
        
        if (!this.matiere) {
          throw new Error('Matière non trouvée');
        }

        // Charger les classes où cette matière est enseignée
        return this.enseignantService.getClasses(this.currentUser!.id);
      })
    ).subscribe({
      next: (classes) => {
        // Filtrer les classes où cette matière est enseignée
        // TODO: Implémenter la vraie logique côté API
        this.classes = classes; // Pour l'instant, toutes les classes
        this.calculateStats();
        this.loadRecentNotes();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = 'Impossible de charger les détails de la matière.';
        this.isLoading = false;
      }
    });
  }

  private loadRecentNotes(): void {
    if (!this.matiere?.id || !this.currentUser?.id) return;

    const filters = {
      matiere_id: this.matiere.id,
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
          this.totalNotes = response.total;
          this.calculateNotesStats();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notes:', error);
        }
      });
  }

  private calculateStats(): void {
    // Calculer le nombre total d'élèves
    this.totalEleves = this.classes.reduce((total, classe) => total + (classe.effectif_actuel || 0), 0);
    
    // Simuler des moyennes par classe (à remplacer par de vraies données)
    this.classes.forEach(classe => {
      this.moyennesParClasse[classe.id] = Math.random() * 8 + 12; // 12-20
    });
  }

  private calculateNotesStats(): void {
    if (this.recentNotes.length === 0) return;

    // Calculer la moyenne générale de la matière
    const notes = this.recentNotes.map(n => n.valeur);
    this.moyenneGenerale = notes.reduce((sum, note) => sum + note, 0) / notes.length;
  }

  getMoyenneClasse(classeId: number): number {
    return this.moyennesParClasse[classeId] || 0;
  }

  getDistributionCount(min: number, max?: number): number {
    return this.recentNotes.filter(note => {
      if (max !== undefined) {
        return note.valeur >= min && note.valeur < max;
      }
      return note.valeur >= min;
    }).length;
  }

  getClasseName(classeId: number): string {
    const classe = this.classes.find(c => c.id === classeId);
    return classe ? classe.nom : 'N/A';
  }

  getNoteColorClass(note: number): string {
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
  viewClasseNotes(classeId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/enseignant/notes'], {
      queryParams: {
        classe_id: classeId,
        matiere_id: this.matiere?.id
      }
    });
  }

  addNoteForClasse(classeId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/enseignant/notes/new'], {
      queryParams: {
        classe_id: classeId,
        matiere_id: this.matiere?.id
      }
    });
  }

  editNote(noteId: number): void {
    this.router.navigate(['/enseignant/notes/edit', noteId]);
  }
}