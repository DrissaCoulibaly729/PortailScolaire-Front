import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { NoteService } from '../../../core/services/note.service';
import { User } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-enseignant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Tableau de bord Enseignant</h1>
            <p class="text-gray-600 mt-2">Gérez vos classes et notes</p>
          </div>
          <div class="text-right" *ngIf="currentUser">
            <p class="text-sm font-medium text-gray-900">{{ currentUser.nom }} {{ currentUser.prenom }}</p>
            <p class="text-xs text-gray-500">Enseignant</p>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-blue-100">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Mes classes</p>
              <p class="text-2xl font-bold text-gray-900">{{ mesClasses }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-purple-100">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Mes matières</p>
              <p class="text-2xl font-bold text-gray-900">{{ mesMatieres }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-green-100">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div class="p-2 rounded-lg bg-yellow-100">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Notes saisies</p>
              <p class="text-2xl font-bold text-gray-900">{{ notesSaisies }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Actions rapides -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Actions rapides</h3>
          <div class="grid grid-cols-2 gap-4">
            <button (click)="router.navigate(['/enseignant/notes/create'])" 
                    class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span class="text-sm font-medium text-gray-900">Saisir des notes</span>
            </button>
            
            <button (click)="router.navigate(['/enseignant/notes'])" 
                    class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span class="text-sm font-medium text-gray-900">Voir mes notes</span>
            </button>
            
            <button (click)="router.navigate(['/enseignant/classes'])" 
                    class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
              </svg>
              <span class="text-sm font-medium text-gray-900">Mes classes</span>
            </button>
            
            <button (click)="router.navigate(['/enseignant/statistiques'])" 
                    class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="w-8 h-8 text-orange-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span class="text-sm font-medium text-gray-900">Statistiques</span>
            </button>
          </div>
        </div>

        <!-- Activité récente -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Activité récente</h3>
          <div class="space-y-4">
            <div *ngFor="let activity of recentActivities" class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                     [ngClass]="{
                       'bg-blue-100': activity.type === 'note_added',
                       'bg-green-100': activity.type === 'note_updated',
                       'bg-yellow-100': activity.type === 'note_deleted'
                     }">
                  <svg class="w-4 h-4" 
                       [ngClass]="{
                         'text-blue-600': activity.type === 'note_added',
                         'text-green-600': activity.type === 'note_updated',
                         'text-yellow-600': activity.type === 'note_deleted'
                       }" 
                       fill="currentColor" viewBox="0 0 20 20">
                    <path *ngIf="activity.type === 'note_added'" d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    <path *ngIf="activity.type === 'note_updated'" fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path>
                    <path *ngIf="activity.type === 'note_deleted'" fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 012 0v4a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v4a1 1 0 11-2 0V9z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">{{ activity.message }}</p>
                <p class="text-xs text-gray-500">{{ activity.timestamp | date:'short' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Classes et matières -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Mes Classes -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Mes classes</h3>
          <div class="space-y-3">
            <div *ngFor="let classe of classesData" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">{{ classe.nom }}</p>
                <p class="text-sm text-gray-600">{{ classe.effectif }} élèves</p>
              </div>
              <button (click)="router.navigate(['/enseignant/classes', classe.id])" 
                      class="text-blue-600 hover:text-blue-800">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Mes Matières -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Mes matières</h3>
          <div class="space-y-3">
            <div *ngFor="let matiere of matieresData" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">{{ matiere.nom }}</p>
                <p class="text-sm text-gray-600">Coeff. {{ matiere.coefficient }}</p>
              </div>
              <button (click)="router.navigate(['/enseignant/matieres', matiere.id])" 
                      class="text-purple-600 hover:text-purple-800">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EnseignantDashboardComponent implements OnInit {
  currentUser: User | null = null;
  
  // Stats
  mesClasses = 0;
  mesMatieres = 0;
  totalEleves = 0;
  notesSaisies = 0;

  // Data
  classesData: any[] = [];
  matieresData: any[] = [];
  recentActivities: any[] = [];

  constructor(
    private authService: AuthService,
    private noteService: NoteService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  private loadDashboardData(): void {
    // Mock data for demo
    this.mesClasses = 3;
    this.mesMatieres = 2;
    this.totalEleves = 85;
    this.notesSaisies = 145;

    this.classesData = [
      { id: 1, nom: '6ème A', effectif: 28 },
      { id: 2, nom: '5ème B', effectif: 30 },
      { id: 3, nom: 'Terminale C', effectif: 27 }
    ];

    this.matieresData = [
      { id: 1, nom: 'Mathématiques', coefficient: 4 },
      { id: 2, nom: 'Physique', coefficient: 3 }
    ];

    this.recentActivities = [
      {
        type: 'note_added',
        message: 'Note ajoutée pour Pierre Durand (6ème A)',
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        type: 'note_updated',
        message: 'Note modifiée pour Sophie Martin (5ème B)',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        type: 'note_added',
        message: 'Notes ajoutées pour l\'examen de mathématiques',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4)
      }
    ];
  }
}