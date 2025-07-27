// src/app/features/enseignant/classes/classe-list/classe-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { EnseignantService } from '../../../../core/services/enseignant.service';
import { Classe } from '../../../../shared/models/classe.model';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-classe-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Mes classes</h1>
            <p class="text-gray-600">Consultez les détails de vos classes assignées</p>
          </div>
          <button (click)="refreshData()" 
                  [disabled]="isLoading"
                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
            <svg class="w-4 h-4 mr-2" [class.animate-spin]="isLoading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && classes.length === 0" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Classes Grid -->
      <div *ngIf="!isLoading || classes.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="classes.length > 0; else noClasses">
          <div *ngFor="let classe of classes" 
               class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
               (click)="router.navigate(['/enseignant/classes', classe.id])">
            
            <!-- Card Header -->
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span class="text-lg font-bold text-blue-600">{{ classe.nom.charAt(0) }}</span>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-xl font-semibold text-gray-900">{{ classe.nom }}</h3>
                    <p class="text-sm text-gray-600">{{ classe.niveau }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="w-3 h-3 rounded-full" 
                       [class]="classe.actif ? 'bg-green-400' : 'bg-red-400'"></div>
                </div>
              </div>
            </div>

            <!-- Card Content -->
            <div class="p-6">
              <!-- Stats principales -->
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">{{ classe.effectif_actuel || 0 }}</div>
                  <div class="text-sm text-gray-600">Élèves</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">{{ classe.effectif_max || 0 }}</div>
                  <div class="text-sm text-gray-600">Maximum</div>
                </div>
              </div>

              <!-- Barre de progression -->
              <div class="mb-4">
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Taux d'occupation</span>
                  <span>{{ getOccupationRate(classe) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                       [style.width.%]="getOccupationRate(classe)"></div>
                </div>
              </div>

              <!-- Informations supplémentaires -->
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Section :</span>
                  <span class="text-gray-900">{{ classe.section || 'N/A' }}</span>
                </div>
                <div class="flex justify-between" *ngIf="classe.description">
                  <span class="text-gray-600">Description :</span>
                  <span class="text-gray-900 truncate ml-2">{{ classe.description }}</span>
                </div>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div class="flex justify-between items-center">
                <div class="flex space-x-2">
                  <button (click)="viewNotes(classe.id, $event)" 
                          class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Voir les notes
                  </button>
                  <span class="text-gray-300">•</span>
                  <button (click)="viewEleves(classe.id, $event)" 
                          class="text-green-600 hover:text-green-800 text-sm font-medium">
                    Liste élèves
                  </button>
                </div>
                <button (click)="viewDetails(classe.id, $event)" 
                        class="text-gray-400 hover:text-gray-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No classes message -->
        <ng-template #noClasses>
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900">Aucune classe assignée</h3>
            <p class="text-gray-500 mt-1">Vous n'avez pas encore de classes assignées.</p>
            <p class="text-gray-500">Contactez l'administration pour plus d'informations.</p>
          </div>
        </ng-template>
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
            <button (click)="loadClasses()" 
                    class="mt-2 text-sm text-red-800 underline hover:text-red-900">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClasseListComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  classes: Classe[] = [];
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
    this.loadClasses();
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
        if (user?.id) {
          this.loadClasses();
        }
      });
  }

  loadClasses(): void {
    if (!this.currentUser?.id) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.enseignantService.getClasses(this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classes) => {
          this.classes = classes;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des classes:', error);
          this.errorMessage = 'Impossible de charger vos classes.';
          this.isLoading = false;
        }
      });
  }

  refreshData(): void {
    this.loadClasses();
  }

  getOccupationRate(classe: Classe): number {
    if (!classe.effectif_max || classe.effectif_max === 0) return 0;
    const rate = ((classe.effectif_actuel || 0) / classe.effectif_max) * 100;
    return Math.min(100, Math.round(rate));
  }

  viewDetails(classeId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/enseignant/classes', classeId]);
  }

  viewNotes(classeId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/enseignant/notes'], { 
      queryParams: { classe_id: classeId } 
    });
  }

  viewEleves(classeId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/enseignant/classes', classeId], { 
      fragment: 'eleves' 
    });
  }
}