// src/app/features/enseignant/matieres/matiere-list/matiere-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { EnseignantService } from '../../../../core/services/enseignant.service';
import { Matiere } from '../../../../shared/models/matiere.model';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-matiere-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Mes matières</h1>
            <p class="text-gray-600">Consultez les détails de vos matières enseignées</p>
          </div>
          <button (click)="refreshData()" 
                  [disabled]="isLoading"
                  class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center">
            <svg class="w-4 h-4 mr-2" [class.animate-spin]="isLoading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && matieres.length === 0" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>

      <!-- Matières Grid -->
      <div *ngIf="!isLoading || matieres.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="matieres.length > 0; else noMatieres">
          <div *ngFor="let matiere of matieres" 
               class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
               (click)="router.navigate(['/enseignant/matieres', matiere.id])">
            
            <!-- Card Header -->
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span class="text-lg font-bold text-purple-600">
                      {{ matiere.code || matiere.nom.charAt(0) }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-xl font-semibold text-gray-900">{{ matiere.nom }}</h3>
                    <p class="text-sm text-gray-600">Code: {{ matiere.code }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="w-3 h-3 rounded-full" 
                       [class]="matiere.active ? 'bg-green-400' : 'bg-red-400'"></div>
                </div>
              </div>
            </div>

            <!-- Card Content -->
            <div class="p-6">
              <!-- Stats principales -->
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600">{{ matiere.coefficient }}</div>
                  <div class="text-sm text-gray-600">Coefficient</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">{{ getClassesCount(matiere.id) }}</div>
                  <div class="text-sm text-gray-600">Classes</div>
                </div>
              </div>

              <!-- Moyennes par niveau -->
              <div class="mb-4" *ngIf="getMoyenneMatiere(matiere.id) > 0">
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Moyenne générale</span>
                  <span>{{ getMoyenneMatiere(matiere.id) | number:'1.2-2' }}/20</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                       [style.width.%]="(getMoyenneMatiere(matiere.id) / 20) * 100"></div>
                </div>
              </div>

              <!-- Description -->
              <div class="text-sm text-gray-600" *ngIf="matiere.description">
                <p class="truncate">{{ matiere.description }}</p>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div class="flex justify-between items-center">
                <div class="flex space-x-2">
                  <button (click)="viewNotes(matiere.id, $event)" 
                          class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    Voir les notes
                  </button>
                  <span class="text-gray-300">•</span>
                  <button (click)="addNote(matiere.id, $event)" 
                          class="text-green-600 hover:text-green-800 text-sm font-medium">
                    Nouvelle note
                  </button>
                </div>
                <button (click)="viewDetails(matiere.id, $event)" 
                        class="text-gray-400 hover:text-gray-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No matieres message -->
        <ng-template #noMatieres>
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900">Aucune matière assignée</h3>
            <p class="text-gray-500 mt-1">Vous n'avez pas encore de matières assignées.</p>
            <p class="text-gray-500">Contactez l'administration pour plus d'informations.</p>
          </div>
        </ng-template>
      </div>

      <!-- Summary Cards -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6" *ngIf="matieres.length > 0">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-purple-100">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total matières</p>
              <p class="text-2xl font-bold text-gray-900">{{ matieres.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-blue-100">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Moyenne générale</p>
              <p class="text-2xl font-bold text-gray-900">{{ getMoyenneGenerale() | number:'1.2-2' }}/20</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-green-100">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Coefficient total</p>
              <p class="text-2xl font-bold text-gray-900">{{ getCoefficientTotal() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class="text-sm font-medium text-red-800">Erreur de chargement</h3>
            <p class="text-sm text-red-700 mt-1">{{ errorMessage }}</p>
            <button (click)="loadMatieres()" 
                    class="mt-2 text-sm text-red-800 underline hover:text-red-900">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MatiereListComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  matieres: Matiere[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Stats calculées (à implémenter avec de vraies données)
  private classesByMatiere: { [key: number]: number } = {};
  private moyennesByMatiere: { [key: number]: number } = {};
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private enseignantService: EnseignantService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadMatieres();
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
          this.loadMatieres();
        }
      });
  }

  loadMatieres(): void {
    if (!this.currentUser?.id) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.enseignantService.getMatieres(this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matieres) => {
          this.matieres = matieres;
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des matières:', error);
          this.errorMessage = 'Impossible de charger vos matières.';
          this.isLoading = false;
        }
      });
  }

  private calculateStats(): void {
    // TODO: Implémenter le calcul des vraies statistiques depuis l'API
    // Pour l'instant, données simulées
    this.matieres.forEach(matiere => {
      this.classesByMatiere[matiere.id] = Math.floor(Math.random() * 5) + 1;
      this.moyennesByMatiere[matiere.id] = Math.random() * 8 + 12; // 12-20
    });
  }

  refreshData(): void {
    this.loadMatieres();
  }

  getClassesCount(matiereId: number): number {
    return this.classesByMatiere[matiereId] || 0;
  }

  getMoyenneMatiere(matiereId: number): number {
    return this.moyennesByMatiere[matiereId] || 0;
  }

  getMoyenneGenerale(): number {
    const moyennes = Object.values(this.moyennesByMatiere).filter(m => m > 0);
    if (moyennes.length === 0) return 0;
    return moyennes.reduce((sum, m) => sum + m, 0) / moyennes.length;
  }

  getCoefficientTotal(): number {
    return this.matieres.reduce((total, matiere) => total + (matiere.coefficient || 0), 0);
  }

  viewDetails(matiereId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/enseignant/matieres', matiereId]);
  }

  viewNotes(matiereId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/enseignant/notes'], { 
      queryParams: { matiere_id: matiereId } 
    });
  }

  addNote(matiereId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/enseignant/notes/new'], { 
      queryParams: { matiere_id: matiereId } 
    });
  }
}