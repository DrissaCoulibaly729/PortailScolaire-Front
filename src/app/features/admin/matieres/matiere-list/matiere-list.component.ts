import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatiereService } from '../../../../core/services/matiere.service';
import { 
  Matiere, 
  MatiereFilters, 
  PaginatedResponse 
} from '../../../../shared/models/matiere.model';

@Component({
  selector: 'app-matiere-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Gestion des matières</h1>
            <p class="text-gray-600 mt-2">Gérer les matières, coefficients et affectations d'enseignants</p>
          </div>
          <div class="flex space-x-3">
            <button (click)="showStatistics()" 
                    class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Statistiques
            </button>
            <button routerLink="/admin/matieres/create" 
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Nouvelle matière
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-purple-100">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total matières</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalMatieres }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-blue-100">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Enseignants affectés</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalEnseignants }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-green-100">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Matières actives</p>
              <p class="text-2xl font-bold text-gray-900">{{ matieresActives }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-yellow-100">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Coeff. moyen</p>
              <p class="text-2xl font-bold text-gray-900">{{ coefficientMoyen }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div class="relative">
              <input type="text" 
                     formControlName="recherche"
                     placeholder="Nom, code matière..."
                     class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select formControlName="active" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option value="">Tous les statuts</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <!-- Coefficient Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Coefficient</label>
            <select formControlName="coefficient" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option value="">Tous coefficients</option>
              <option value="1">1.0</option>
              <option value="2">2.0</option>
              <option value="3">3.0</option>
              <option value="4">4.0</option>
              <option value="5">5.0</option>
            </select>
          </div>

          <!-- Items per page -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Par page</label>
            <select formControlName="per_page" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </form>

        <!-- Reset Filters -->
        <div class="mt-4 flex justify-end">
          <button (click)="resetFilters()" 
                  class="text-sm text-gray-600 hover:text-gray-900">
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="bg-white rounded-lg shadow-sm p-8">
        <div class="flex justify-center items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span class="ml-3 text-gray-600">Chargement des matières...</span>
        </div>
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

      <!-- Matières Grid -->
      <div *ngIf="!isLoading && !error" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let matiere of matieres" class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <!-- Card Header -->
          <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div class="p-3 rounded-lg bg-purple-100">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-lg font-semibold text-gray-900">{{ matiere.nom }}</h3>
                  <p class="text-sm text-gray-500 font-mono">{{ matiere.code }}</p>
                </div>
              </div>
              
              <!-- Status Badge -->
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-green-100 text-green-800': matiere.actif,
                      'bg-red-100 text-red-800': !matiere.active
                    }">
                <span class="w-1.5 h-1.5 mr-1.5 rounded-full"
                      [ngClass]="{
                        'bg-green-400': matiere.actif,
                        'bg-red-400': !matiere.active
                      }"></span>
                {{ matiere.actif ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <!-- Matière Info -->
            <div class="space-y-3">
              <!-- Coefficient -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Coefficient</span>
                <div class="flex items-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-green-100 text-green-800': matiere.coefficient >= 3,
                          'bg-yellow-100 text-yellow-800': matiere.coefficient >= 2 && matiere.coefficient < 3,
                          'bg-gray-100 text-gray-800': matiere.coefficient < 2
                        }">
                    {{ matiere.coefficient | number:'1.1-1' }}
                  </span>
                </div>
              </div>

              <!-- Teachers Count -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Enseignants</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ matiere.enseignants?.length || 0 }}
                </span>
              </div>

              <!-- Notes Count -->
              <div class="flex items-center justify-between" *ngIf="matiere.nombre_notes !== undefined">
                <span class="text-sm text-gray-600">Notes saisies</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ matiere.nombre_notes || 0 }}
                </span>
              </div>

              <!-- Average -->
              <div class="flex items-center justify-between" *ngIf="matiere.moyenne_generale">
                <span class="text-sm text-gray-600">Moyenne générale</span>
                <span class="text-sm font-medium" 
                      [ngClass]="{
                        'text-green-600': matiere.moyenne_generale >= 12,
                        'text-yellow-600': matiere.moyenne_generale >= 10 && matiere.moyenne_generale < 12,
                        'text-red-600': matiere.moyenne_generale < 10
                      }">
                  {{ matiere.moyenne_generale | number:'1.2-2' }}/20
                </span>
              </div>

              <!-- Description -->
              <div *ngIf="matiere.description" class="pt-2">
                <p class="text-sm text-gray-600 line-clamp-2">{{ matiere.description }}</p>
              </div>
            </div>
          </div>

          <!-- Teachers List -->
          <div *ngIf="matiere.enseignants && matiere.enseignants.length > 0" class="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <h4 class="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Enseignants</h4>
            <div class="flex flex-wrap gap-1">
              <span *ngFor="let enseignant of matiere.enseignants.slice(0, 3)" 
                    class="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                {{ enseignant.nom }} {{ enseignant.prenom }}
              </span>
              <span *ngIf="matiere.enseignants.length > 3" 
                    class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                +{{ matiere.enseignants.length - 3 }}
              </span>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div class="flex justify-between items-center">
              <!-- Quick Info -->
              <div class="text-xs text-gray-500">
                <span *ngIf="matiere.updated_at">Modifiée {{ matiere.updated_at | date:'short' }}</span>
              </div>

              <!-- Action Buttons -->
              <div class="flex space-x-2">
                <button (click)="viewMatiere(matiere)" 
                        class="p-1 text-purple-600 hover:text-purple-900" 
                        title="Voir les détails">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </button>

                <button (click)="editMatiere(matiere)" 
                        class="p-1 text-blue-600 hover:text-blue-900" 
                        title="Modifier">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>

                <button (click)="manageTeachers(matiere)" 
                        class="p-1 text-green-600 hover:text-green-900" 
                        title="Gérer les enseignants">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </button>

                <button (click)="toggleMatiereStatus(matiere)" 
                        [class]="matiere.actif ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
                        [title]="matiere.actif ? 'Désactiver' : 'Activer'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path *ngIf="matiere.actif" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    <path *ngIf="!matiere.actif" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <div class="relative">
                  <button (click)="toggleDropdown(matiere.id)" 
                          class="p-1 text-gray-400 hover:text-gray-600"
                          title="Plus d'actions">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                    </svg>
                  </button>

                  <div *ngIf="openDropdown === matiere.id" 
                       class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div class="py-1">
                      <button (click)="viewNotes(matiere)" 
                              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Voir les notes
                      </button>
                      <button (click)="generateReport(matiere)" 
                              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Générer rapport
                      </button>
                      <hr class="my-1">
                      <button (click)="deleteMatiere(matiere)" 
                              class="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="matieres.length === 0" class="col-span-full">
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune matière trouvée</h3>
            <p class="text-gray-500 mb-6">Aucune matière ne correspond aux critères de recherche.</p>
            <button routerLink="/admin/matieres/create" 
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Créer la première matière
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="pagination && matieres.length > 0" class="mt-6 bg-white px-4 py-3 border border-gray-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button [disabled]="!pagination.links.prev" 
                    (click)="goToPage(pagination.meta.current_page - 1)"
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Précédent
            </button>
            <button [disabled]="!pagination.links.next" 
                    (click)="goToPage(pagination.meta.current_page + 1)"
                    class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Suivant
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Affichage de 
                <span class="font-medium">{{ pagination.meta.from }}</span>
                à 
                <span class="font-medium">{{ pagination.meta.to }}</span>
                sur 
                <span class="font-medium">{{ pagination.meta.total }}</span>
                résultats
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button [disabled]="!pagination.links.prev" 
                        (click)="goToPage(pagination.meta.current_page - 1)"
                        class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>

                <button *ngFor="let page of getPageNumbers()" 
                        (click)="goToPage(page)"
                        [class]="page === pagination.meta.current_page ? 
                          'bg-purple-50 border-purple-500 text-purple-600' : 
                          'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
                        class="relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                  {{ page }}
                </button>

                <button [disabled]="!pagination.links.next" 
                        (click)="goToPage(pagination.meta.current_page + 1)"
                        class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MatiereListComponent implements OnInit {
  matieres: Matiere[] = [];
  pagination: any = null;
  isLoading = false;
  error: string | null = null;

  // Form and filters
  filterForm: FormGroup;
  
  // UI state
  openDropdown: number | null = null;

  // Stats
  totalMatieres = 0;
  totalEnseignants = 0;
  matieresActives = 0;
  coefficientMoyen = 0;

  constructor(
    private matiereService: MatiereService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      recherche: [''],
      actif: [''],
      coefficient: [''],
      per_page: [25]
    });
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.loadMatieres();
    this.loadStats();
  }

  /**
   * Initialize filters with debouncing
   */
  private initializeFilters(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadMatieres();
    });
  }

  /**
   * Load matieres with current filters
   */
  loadMatieres(page: number = 1): void {
    this.isLoading = true;
    this.error = null;

    const filters: MatiereFilters = {
      ...this.filterForm.value,
      page
    };

    // Clean empty filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof MatiereFilters] === '' || filters[key as keyof MatiereFilters] === null) {
        delete filters[key as keyof MatiereFilters];
      }
    });

    this.matiereService.getMatieres(filters).subscribe({
      next: (response) => {
        this.matieres = response.data;
        this.pagination = {
          meta: response.meta,
          links: response.links
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des matières:', error);
        this.error = 'Impossible de charger les matières';
        this.isLoading = false;
        
        // Load mock data for demo
        this.loadMockData();
      }
    });
  }

  /**
   * Load statistics
   */
  loadStats(): void {
    // Mock stats for demo
    this.totalMatieres = 15;
    this.totalEnseignants = 42;
    this.matieresActives = 13;
    this.coefficientMoyen = 2.8;
  }

  /**
   * Load mock data for demonstration
   */
  private loadMockData(): void {
    this.matieres = [
      {
        id: 1,
        nom: 'Mathématiques',
        code: 'MATH',
        coefficient: 4.0,
        description: 'Mathématiques générales - Algèbre, géométrie et analyse',
        actif: true,
        nombre_notes: 156,
        moyenne_generale: 13.2,
        enseignants: [
          { id: 1, nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont&#64;ecole.fr' },
          { id: 2, nom: 'Martin', prenom: 'Marie', email: 'marie.martin&#64;ecole.fr' }
        ],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        nom: 'Français',
        code: 'FR',
        coefficient: 3.0,
        description: 'Langue française - Littérature et expression écrite',
        actif: true,
        nombre_notes: 124,
        moyenne_generale: 12.8,
        enseignants: [
          { id: 3, nom: 'Durand', prenom: 'Sophie', email: 'sophie.durand&#64;ecole.fr' }
        ],
        created_at: '2024-01-16T11:00:00Z',
        updated_at: '2024-01-21T15:45:00Z'
      },
      {
        id: 3,
        nom: 'Sciences Physiques',
        code: 'PHYS',
        coefficient: 3.5,
        description: 'Physique et chimie appliquées',
        actif: true,
        nombre_notes: 89,
        moyenne_generale: 11.5,
        enseignants: [
          { id: 4, nom: 'Moreau', prenom: 'Pierre', email: 'pierre.moreau&#64;ecole.fr' }
        ],
        created_at: '2024-01-17T12:00:00Z',
        updated_at: '2024-01-22T16:00:00Z'
      },
      {
        id: 4,
        nom: 'Art Plastique',
        code: 'ART',
        coefficient: 1.0,
        description: 'Arts visuels et créativité',
        actif: false,
        nombre_notes: 45,
        moyenne_generale: 15.2,
        enseignants: [],
        created_at: '2024-01-18T13:00:00Z',
        updated_at: '2024-01-23T17:00:00Z'
      }
    ];

    this.pagination = {
      meta: {
        current_page: 1,
        per_page: 25,
        total: 4,
        last_page: 1,
        from: 1,
        to: 4
      },
      links: {
        first: null,
        last: null,
        prev: null,
        next: null
      }
    };

    this.isLoading = false;
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.filterForm.reset({
      recherche: '',
      actif: '',
      coefficient: '',
      per_page: 25
    });
  }

  /**
   * Toggle dropdown menu
   */
  toggleDropdown(matiereId: number): void {
    this.openDropdown = this.openDropdown === matiereId ? null : matiereId;
  }

  /**
   * Close dropdown when clicking outside
   */
  closeDropdown(): void {
    this.openDropdown = null;
  }

  /**
   * Matiere actions
   */
  viewMatiere(matiere: Matiere): void {
    this.router.navigate(['/admin/matieres', matiere.id]);
    this.closeDropdown();
  }

  editMatiere(matiere: Matiere): void {
    this.router.navigate(['/admin/matieres/edit', matiere.id]);
    this.closeDropdown();
  }

  manageTeachers(matiere: Matiere): void {
    this.router.navigate(['/admin/matieres', matiere.id, 'teachers']);
    this.closeDropdown();
  }

  toggleMatiereStatus(matiere: Matiere): void {
    const action = matiere.actif ? 'désactiver' : 'activer';
    
    if (confirm(`Êtes-vous sûr de vouloir ${action} la matière "${matiere.nom}" ?`)) {
      this.matiereService.toggleMatiereStatus(matiere.id).subscribe({
        next: () => {
          matiere.actif = !matiere.actif;
          console.log(`Matière ${action}e avec succès`);
        },
        error: (error) => {
          console.error(`Erreur lors de la modification du statut:`, error);
          alert(`Impossible de ${action} la matière`);
        }
      });
    }
    this.closeDropdown();
  }

  viewNotes(matiere: Matiere): void {
    this.router.navigate(['/admin/matieres', matiere.id, 'notes']);
    this.closeDropdown();
  }

  generateReport(matiere: Matiere): void {
    console.log('Generate report for matiere:', matiere.nom);
    this.closeDropdown();
  }

  deleteMatiere(matiere: Matiere): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la matière "${matiere.nom}" ?`)) {
      this.matiereService.deleteMatiere(matiere.id).subscribe({
        next: () => {
          this.matieres = this.matieres.filter(m => m.id !== matiere.id);
          console.log('Matière supprimée avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Impossible de supprimer la matière');
        }
      });
    }
    this.closeDropdown();
  }

  /**
   * Show statistics modal
   */
  showStatistics(): void {
    console.log('Show statistics modal');
  }

  /**
   * Pagination
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination?.meta.last_page || 1)) {
      this.loadMatieres(page);
    }
  }

  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const current = this.pagination.meta.current_page;
    const last = this.pagination.meta.last_page;
    const pages: number[] = [];
    
    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}