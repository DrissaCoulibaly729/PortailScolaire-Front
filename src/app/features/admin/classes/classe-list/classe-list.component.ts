import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ClasseService } from '../../../../core/services/classe.service';
import { 
  Classe, 
  ClasseFilters, 
  PaginatedResponse,
  NIVEAUX_DISPONIBLES as NIVEAUX_SCOLAIRES,
  NiveauScolaire 
} from '../../../../shared/models/classe.model';

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
            <h1 class="text-3xl font-bold text-gray-900">Gestion des classes</h1>
            <p class="text-gray-600 mt-2">Gérer les classes, effectifs et affectations d'enseignants</p>
          </div>
          <div class="flex space-x-3">
            <button (click)="showStatistics()" 
                    class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Statistiques
            </button>
            <button routerLink="/admin/classes/create" 
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Nouvelle classe
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-lg bg-green-100">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div class="p-2 rounded-lg bg-blue-100">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div class="p-2 rounded-lg bg-yellow-100">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Taux occupation</p>
              <p class="text-2xl font-bold text-gray-900">{{ tauxOccupation }}%</p>
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
              <p class="text-2xl font-bold text-gray-900">{{ moyenneGenerale }}</p>
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
                     placeholder="Nom de classe, niveau..."
                     class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
              <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          <!-- Level Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
            <select formControlName="niveau" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
              <option value="">Tous les niveaux</option>
              <option *ngFor="let niveau of niveauxScolaires" [value]="niveau.value">{{ niveau.label }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select formControlName="active" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
              <option value="">Tous les statuts</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <!-- Items per page -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Par page</label>
            <select formControlName="per_page" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
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
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span class="ml-3 text-gray-600">Chargement des classes...</span>
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

      <!-- Classes Grid -->
      <div *ngIf="!isLoading && !error" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div *ngFor="let classe of classes" class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <!-- Card Header -->
          <div class="p-6 pb-4">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="p-2 rounded-lg bg-green-100">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-lg font-semibold text-gray-900">{{ classe.nom }}</h3>
                  <p class="text-sm text-gray-500">{{ classe.niveau }}</p>
                </div>
              </div>
              
              <!-- Status Badge -->
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-green-100 text-green-800': classe.actif,
                      'bg-red-100 text-red-800': !classe.active
                    }">
                <span class="w-1.5 h-1.5 mr-1.5 rounded-full"
                      [ngClass]="{
                        'bg-green-400': classe.actif,
                        'bg-red-400': !classe.active
                      }"></span>
                {{ classe.actif ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <!-- Class Info -->
            <div class="space-y-3">
              <!-- Effectif -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Effectif</span>
                <div class="flex items-center">
                  <span class="text-sm font-medium text-gray-900">{{ classe.effectif_actuel || 0 }}</span>
                  <span class="text-sm text-gray-500 mx-1">/</span>
                  <span class="text-sm text-gray-500">{{ classe.effectif_max }}</span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full" 
                     [style.width.%]="getOccupationPercentage(classe)"
                     [ngClass]="{
                       'bg-green-500': getOccupationPercentage(classe) < 80,
                       'bg-yellow-500': getOccupationPercentage(classe) >= 80 && getOccupationPercentage(classe) < 95,
                       'bg-red-500': getOccupationPercentage(classe) >= 95
                     }"></div>
              </div>

              <!-- Teacher Count -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Enseignants</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ classe.enseignants?.length || 0 }}
                </span>
              </div>

              <!-- Average -->
              <div class="flex items-center justify-between" *ngIf="classe.moyenne">
                <span class="text-sm text-gray-600">Moyenne</span>
                <span class="text-sm font-medium" 
                      [ngClass]="{
                        'text-green-600': classe.moyenne >= 12,
                        'text-yellow-600': classe.moyenne >= 10 && classe.moyenne < 12,
                        'text-red-600': classe.moyenne < 10
                      }">
                  {{ classe.moyenne | number:'1.2-2' }}/20
                </span>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div class="flex justify-between items-center">
              <!-- Quick Info -->
              <div class="flex space-x-4 text-xs text-gray-500">
                <span *ngIf="classe.section">Section {{ classe.section }}</span>
                <span *ngIf="classe.updated_at">Modifiée {{ classe.updated_at | date:'short' }}</span>
              </div>

              <!-- Action Buttons -->
              <div class="flex space-x-2">
                <button (click)="viewClasse(classe)" 
                        class="p-1 text-green-600 hover:text-green-900" 
                        title="Voir les détails">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </button>

                <button (click)="editClasse(classe)" 
                        class="p-1 text-blue-600 hover:text-blue-900" 
                        title="Modifier">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>

                <button (click)="toggleClasseStatus(classe)" 
                        [class]="classe.actif ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
                        [title]="classe.actif ? 'Désactiver' : 'Activer'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path *ngIf="classe.actif" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    <path *ngIf="!classe.actif" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <div class="relative">
                  <button (click)="toggleDropdown(classe.id)" 
                          class="p-1 text-gray-400 hover:text-gray-600"
                          title="Plus d'actions">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                    </svg>
                  </button>

                  <div *ngIf="openDropdown === classe.id" 
                       class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div class="py-1">
                      <button (click)="manageTeachers(classe)" 
                              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        Gérer les enseignants
                      </button>
                      <button (click)="viewStudents(classe)" 
                              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                        Voir les élèves
                      </button>
                      <hr class="my-1">
                      <button (click)="deleteClasse(classe)" 
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
        <div *ngIf="classes.length === 0" class="col-span-full">
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune classe trouvée</h3>
            <p class="text-gray-500 mb-6">Aucune classe ne correspond aux critères de recherche.</p>
            <button routerLink="/admin/classes/create" 
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Créer la première classe
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="pagination && classes.length > 0" class="mt-6 bg-white px-4 py-3 border border-gray-200 rounded-lg">
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
                          'bg-green-50 border-green-500 text-green-600' : 
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
export class ClasseListComponent implements OnInit {
  classes: Classe[] = [];
  pagination: any = null;
  isLoading = false;
  error: string | null = null;

  // Form and filters
  filterForm: FormGroup;
  niveauxScolaires = NIVEAUX_SCOLAIRES;
  
  // UI state
  openDropdown: number | null = null;

  // Stats
  totalClasses = 0;
  totalEleves = 0;
  tauxOccupation = 0;
  moyenneGenerale = 0;

  constructor(
    private classeService: ClasseService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      recherche: [''],
      niveau: [''],
      actif: [''],
      per_page: [25]
    });
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.loadClasses();
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
      this.loadClasses();
    });
  }

  /**
   * Load classes with current filters
   */
  loadClasses(page: number = 1): void {
    this.isLoading = true;
    this.error = null;

    const filters: ClasseFilters = {
      ...this.filterForm.value,
      page
    };

    // Clean empty filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof ClasseFilters] === '' || filters[key as keyof ClasseFilters] === null) {
        delete filters[key as keyof ClasseFilters];
      }
    });

    this.classeService.getClasses(filters).subscribe({
      next: (response) => {
        this.classes = response.data;
        this.pagination = {
          meta: response.meta,
          links: response.links
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des classes:', error);
        this.error = 'Impossible de charger les classes';
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
    this.classeService.getClasseStatistiques().subscribe({
      next: (stats) => {
        this.totalClasses = stats.total_classes || 0;
        this.totalEleves = stats.total_eleves || 0;
        this.tauxOccupation = stats.taux_occupation || 0;
        this.moyenneGenerale = stats.moyenne_generale || 0;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        // Default values
        this.totalClasses = 12;
        this.totalEleves = 324;
        this.tauxOccupation = 85;
        this.moyenneGenerale = 13.2;
      }
    });
  }

  /**
   * Load mock data for demonstration
   */
  private loadMockData(): void {
    this.classes = [
      {
        id: 1,
        nom: '6ème A',
        niveau: '6ème' as NiveauScolaire,
        section: 'A',
        effectif_max: 30,
        effectif_actuel: 28,
        description: 'Classe de 6ème section A',
        actif: true,
        moyenne: 13.5,
        enseignants: [],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        nom: '5ème B',
        niveau: '5ème' as NiveauScolaire,
        section: 'B',
        effectif_max: 32,
        effectif_actuel: 30,
        description: 'Classe de 5ème section B',
        actif: true,
        moyenne: 12.8,
        enseignants: [],
        created_at: '2024-01-16T11:00:00Z',
        updated_at: '2024-01-21T15:45:00Z'
      },
      {
        id: 3,
        nom: 'Terminale C',
        niveau: 'Terminale' as NiveauScolaire,
        section: 'C',
        effectif_max: 25,
        effectif_actuel: 23,
        description: 'Classe de Terminale C - Sciences',
        actif: true,
        moyenne: 14.2,
        enseignants: [],
        created_at: '2024-01-17T12:00:00Z',
        updated_at: '2024-01-22T16:00:00Z'
      }
    ];

    this.pagination = {
      meta: {
        current_page: 1,
        per_page: 25,
        total: 3,
        last_page: 1,
        from: 1,
        to: 3
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
      niveau: '',
      actif: '',
      per_page: 25
    });
  }

  /**
   * Calculate occupation percentage
   */
  getOccupationPercentage(classe: Classe): number {
    if (!classe.effectif_max || classe.effectif_max === 0) return 0;
    return Math.round(((classe.effectif_actuel || 0) / classe.effectif_max) * 100);
  }

  /**
   * Toggle dropdown menu
   */
  toggleDropdown(classeId: number): void {
    this.openDropdown = this.openDropdown === classeId ? null : classeId;
  }

  /**
   * Close dropdown when clicking outside
   */
  closeDropdown(): void {
    this.openDropdown = null;
  }

  /**
   * Class actions
   */
  viewClasse(classe: Classe): void {
    this.router.navigate(['/admin/classes', classe.id]);
    this.closeDropdown();
  }

  editClasse(classe: Classe): void {
    this.router.navigate(['/admin/classes/edit', classe.id]);
    this.closeDropdown();
  }

  toggleClasseStatus(classe: Classe): void {
    const action = classe.actif ? 'désactiver' : 'activer';
    
    if (confirm(`Êtes-vous sûr de vouloir ${action} la classe "${classe.nom}" ?`)) {
      this.classeService.toggleClasseStatus(classe.id).subscribe({
        next: () => {
          classe.actif = !classe.actif;
          console.log(`Classe ${action}e avec succès`);
        },
        error: (error) => {
          console.error(`Erreur lors de la modification du statut:`, error);
          alert(`Impossible de ${action} la classe`);
        }
      });
    }
    this.closeDropdown();
  }

  manageTeachers(classe: Classe): void {
    // Navigate to teacher management for this class
    this.router.navigate(['/admin/classes', classe.id, 'teachers']);
    this.closeDropdown();
  }

  viewStudents(classe: Classe): void {
    // Navigate to student list for this class
    this.router.navigate(['/admin/classes', classe.id, 'students']);
    this.closeDropdown();
  }

  deleteClasse(classe: Classe): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la classe "${classe.nom}" ?`)) {
      this.classeService.deleteClasse(classe.id).subscribe({
        next: () => {
          this.classes = this.classes.filter(c => c.id !== classe.id);
          console.log('Classe supprimée avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Impossible de supprimer la classe');
        }
      });
    }
    this.closeDropdown();
  }

  /**
   * Show statistics modal
   */
  showStatistics(): void {
    // Implementation for statistics modal
    console.log('Show statistics modal');
  }

  /**
   * Pagination
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination?.meta.last_page || 1)) {
      this.loadClasses(page);
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