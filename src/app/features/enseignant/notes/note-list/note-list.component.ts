// src/app/features/enseignant/notes/note-list/note-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { EnseignantService } from '../../../../core/services/enseignant.service';
import { Note, NoteFilters, TYPES_EVALUATION, PERIODES_TYPES } from '../../../../shared/models/note.model';
import { Classe } from '../../../../shared/models/classe.model';
import { Matiere } from '../../../../shared/models/matiere.model';
import { User } from '../../../../shared/models/user.model';
import { PaginatedResponse } from '../../../../shared/models/common.model';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Gestion des notes</h1>
            <p class="text-gray-600">Consultez et gérez toutes vos notes saisies</p>
          </div>
          <div class="flex space-x-3">
            <button (click)="router.navigate(['/enseignant/notes/batch'])" 
                    class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Saisie en lot
            </button>
            <button (click)="router.navigate(['/enseignant/notes/new'])" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Nouvelle note
            </button>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Filtres</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Recherche -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input type="text" 
                   [(ngModel)]="searchTerm"
                   (ngModelChange)="onSearchChange()"
                   placeholder="Nom de l'élève..."
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <!-- Classe -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Classe</label>
            <select [(ngModel)]="filters.classe_id" (ngModelChange)="applyFilters()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Toutes les classes</option>
              <option *ngFor="let classe of classes" [value]="classe.id">{{ classe.nom }}</option>
            </select>
          </div>

          <!-- Matière -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Matière</label>
            <select [(ngModel)]="filters.matiere_id" (ngModelChange)="applyFilters()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Toutes les matières</option>
              <option *ngFor="let matiere of matieres" [value]="matiere.id">{{ matiere.nom }}</option>
            </select>
          </div>

          <!-- Type d'évaluation -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select [(ngModel)]="filters.type" (ngModelChange)="applyFilters()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les types</option>
              <option *ngFor="let type of typesEvaluation" [value]="type.value">{{ type.label }}</option>
            </select>
          </div>

          <!-- Période -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Période</label>
            <select [(ngModel)]="filters.periode" (ngModelChange)="applyFilters()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Toutes les périodes</option>
              <option *ngFor="let periode of periodes" [value]="periode.value">{{ periode.label }}</option>
            </select>
          </div>

          <!-- Date début -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date début</label>
            <input type="date" 
                   [(ngModel)]="filters.date_debut" 
                   (ngModelChange)="applyFilters()"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <!-- Date fin -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
            <input type="date" 
                   [(ngModel)]="filters.date_fin" 
                   (ngModelChange)="applyFilters()"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <!-- Actions -->
          <div class="flex items-end">
            <button (click)="clearFilters()" 
                    class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 w-full">
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Liste des notes -->
      <div *ngIf="!isLoading" class="bg-white rounded-lg shadow-sm border overflow-hidden">
        <!-- En-tête -->
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">
              Notes ({{ paginatedData?.total || 0 }})
            </h3>
            <div class="flex items-center space-x-4">
              <!-- Tri -->
              <select [(ngModel)]="sortBy" (ngModelChange)="applyFilters()"
                      class="px-3 py-1 border border-gray-300 rounded text-sm">
                <option value="date_evaluation:desc">Date (plus récent)</option>
                <option value="date_evaluation:asc">Date (plus ancien)</option>
                <option value="valeur:desc">Note (plus haute)</option>
                <option value="valeur:asc">Note (plus basse)</option>
                <option value="eleve.nom:asc">Élève (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200" *ngIf="notes.length > 0; else noNotes">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élève</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let note of notes" class="hover:bg-gray-50">
                <!-- Élève -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span class="text-xs font-medium text-blue-800">
                        {{ note.eleve?.nom?.charAt(0) }}{{ note.eleve?.prenom?.charAt(0) }}
                      </span>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">
                        {{ note.eleve?.nom }} {{ note.eleve?.prenom }}
                      </p>
                      <p class="text-xs text-gray-500" *ngIf="note.eleve?.numero_etudiant">
                        {{ note.eleve.numero_etudiant }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Classe -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getClasseName(note.classe_id) }}
                </td>

                <!-- Matière -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getMatiereName(note.matiere_id) }}
                </td>

                <!-- Note -->
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

                <!-- Type -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full" [class]="getTypeClass(note.type)">
                    {{ getTypeLabel(note.type) }}
                  </span>
                </td>

                <!-- Période -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getPeriodeLabel(note.periode) }}
                </td>

                <!-- Date -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ note.date_evaluation | date:'dd/MM/yyyy' }}
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button (click)="editNote(note)" 
                            class="text-blue-600 hover:text-blue-900">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button (click)="deleteNote(note)" 
                            class="text-red-600 hover:text-red-900">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- No notes message -->
          <ng-template #noNotes>
            <div class="text-center py-12">
              <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <h3 class="text-lg font-medium text-gray-900">Aucune note trouvée</h3>
              <p class="text-gray-500 mt-1">Commencez par saisir des notes pour vos élèves.</p>
              <button (click)="router.navigate(['/enseignant/notes/new'])" 
                      class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Ajouter une note
              </button>
            </div>
          </ng-template>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50" *ngIf="paginatedData && paginatedData.total > 0">
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-700">
              Affichage de {{ ((currentPage - 1) * pageSize) + 1 }} à 
              {{ Math.min(currentPage * pageSize, paginatedData.total) }} 
              sur {{ paginatedData.total }} résultats
            </div>
            <div class="flex space-x-2">
              <button (click)="previousPage()" 
                      [disabled]="currentPage <= 1"
                      class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
                Précédent
              </button>
              <span class="px-3 py-1 text-sm">
                Page {{ currentPage }} sur {{ totalPages }}
              </span>
              <button (click)="nextPage()" 
                      [disabled]="currentPage >= totalPages"
                      class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
                Suivant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NoteListComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  notes: Note[] = [];
  classes: Classe[] = [];
  matieres: Matiere[] = [];
  
  // Pagination
  paginatedData: PaginatedResponse<Note> | null = null;
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  
  // Filtres
  filters: NoteFilters = {};
  searchTerm = '';
  sortBy = 'date_evaluation:desc';
  
  // States
  isLoading = false;
  
  // Constants
  typesEvaluation = TYPES_EVALUATION;
  periodes = PERIODES_TYPES;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private authService: AuthService,
    private enseignantService: EnseignantService,
    public router: Router
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filters.recherche = searchTerm;
      this.currentPage = 1;
      this.loadNotes();
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadInitialData();
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
        if (user?.id) {
          this.filters.enseignant_id = user.id;
          this.loadNotes();
        }
      });
  }

  private loadInitialData(): void {
    if (!this.currentUser?.id) return;

    // Charger classes et matières
    this.enseignantService.classes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(classes => this.classes = classes);

    this.enseignantService.matieres$
      .pipe(takeUntil(this.destroy$))
      .subscribe(matieres => this.matieres = matieres);

    // Si pas de données en cache, les charger
    if (this.classes.length === 0 || this.matieres.length === 0) {
      this.enseignantService.getClasses(this.currentUser.id).subscribe();
      this.enseignantService.getMatieres(this.currentUser.id).subscribe();
    }
  }

  loadNotes(): void {
    if (!this.currentUser?.id) return;

    this.isLoading = true;
    
    // Préparer les filtres avec pagination et tri
    const queryFilters: NoteFilters = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.pageSize
    };

    // Appliquer le tri
    if (this.sortBy) {
      const [field, direction] = this.sortBy.split(':');
      queryFilters.sort_by = field;
      queryFilters.sort_direction = direction as 'asc' | 'desc';
    }

    this.enseignantService.getNotes(this.currentUser.id, queryFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.paginatedData = response;
          this.notes = response.data;
          this.totalPages = Math.ceil(response.total / this.pageSize);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notes:', error);
          this.isLoading = false;
        }
      });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadNotes();
  }

  clearFilters(): void {
    this.filters = { enseignant_id: this.currentUser?.id };
    this.searchTerm = '';
    this.sortBy = 'date_evaluation:desc';
    this.currentPage = 1;
    this.loadNotes();
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadNotes();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadNotes();
    }
  }

  // Actions
  editNote(note: Note): void {
    this.router.navigate(['/enseignant/notes/edit', note.id]);
  }

  deleteNote(note: Note): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette note (${note.valeur}/20) ?`)) {
      this.enseignantService.deleteNote(note.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadNotes(); // Recharger la liste
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression de la note.');
          }
        });
    }
  }

  // Utility methods
  getClasseName(classeId: number): string {
    const classe = this.classes.find(c => c.id === classeId);
    return classe ? classe.nom : 'N/A';
  }

  getMatiereName(matiereId: number): string {
    const matiere = this.matieres.find(m => m.id === matiereId);
    return matiere ? matiere.nom : 'N/A';
  }

  getTypeLabel(type: string): string {
    const typeObj = this.typesEvaluation.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  }

  getTypeClass(type: string): string {
    const typeObj = this.typesEvaluation.find(t => t.value === type);
    if (!typeObj) return 'bg-gray-100 text-gray-800';
    
    const colorMap = {
      'blue': 'bg-blue-100 text-blue-800',
      'orange': 'bg-orange-100 text-orange-800',
      'red': 'bg-red-100 text-red-800'
    };
    return colorMap[typeObj.color as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  }

  getPeriodeLabel(periode: string): string {
    const periodeObj = this.periodes.find(p => p.value === periode);
    return periodeObj ? periodeObj.label : periode;
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
}