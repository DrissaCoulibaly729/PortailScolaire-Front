// src/app/layouts/enseignant-layout/enseignant-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
// CORRECTION 1: Utiliser le bon import pour User
import { User } from '../../shared/models/auth.model'; // ou user.model selon votre structure

@Component({
  selector: 'app-enseignant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Logo et Navigation -->
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <h1 class="text-xl font-bold text-blue-600">📚 Portail Enseignant</h1>
              </div>
              
              <!-- Navigation principale -->
              <nav class="hidden md:ml-10 md:flex md:space-x-8">
                <a routerLink="/enseignant/dashboard" 
                   routerLinkActive="border-blue-500 text-blue-600"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                  </svg>
                  Tableau de bord
                </a>
                
                <a routerLink="/enseignant/notes" 
                   routerLinkActive="border-blue-500 text-blue-600"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  Gestion des notes
                </a>
                
                <a routerLink="/enseignant/classes" 
                   routerLinkActive="border-blue-500 text-blue-600"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path>
                  </svg>
                  Mes classes
                </a>
                
                <a routerLink="/enseignant/matieres" 
                   routerLinkActive="border-blue-500 text-blue-600"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  Mes matières
                </a>
              </nav>
            </div>

            <!-- Actions utilisateur -->
            <div class="flex items-center space-x-4">
              <!-- Notifications -->
              <button class="text-gray-400 hover:text-gray-500 relative">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <span class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">{{ notificationCount }}</span>
              </button>

              <!-- Menu utilisateur -->
              <div class="relative">
                <button (click)="toggleUserMenu()" 
                        class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center" *ngIf="currentUser">
                    <span class="text-sm font-medium text-blue-800">
                      {{ currentUser.nom?.charAt(0) }}{{ currentUser.prenom?.charAt(0) }}
                    </span>
                  </div>
                  <div class="ml-2 text-left" *ngIf="currentUser">
                    <p class="text-sm font-medium text-gray-900">{{ currentUser.nom }} {{ currentUser.prenom }}</p>
                    <p class="text-xs text-gray-500">Enseignant</p>
                  </div>
                  <svg class="ml-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                <!-- Menu déroulant -->
                <div *ngIf="showUserMenu" 
                     class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                  <a routerLink="/auth/profile" 
                     class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mon profil
                  </a>
                  <a routerLink="/auth/settings" 
                     class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Paramètres
                  </a>
                  <div class="border-t border-gray-100"></div>
                  <button (click)="logout()" 
                          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>

            <!-- Menu mobile -->
            <div class="md:hidden">
              <button (click)="toggleMobileMenu()" 
                      class="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Navigation mobile -->
        <div *ngIf="showMobileMenu" class="md:hidden bg-white border-t border-gray-200">
          <div class="px-2 pt-2 pb-3 space-y-1">
            <a routerLink="/enseignant/dashboard" 
               class="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md">
              Tableau de bord
            </a>
            <a routerLink="/enseignant/notes" 
               class="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md">
              Gestion des notes
            </a>
            <a routerLink="/enseignant/classes" 
               class="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md">
              Mes classes
            </a>
            <a routerLink="/enseignant/matieres" 
               class="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md">
               Mes matières
            </a>
          </div>
        </div>
      </header>

      <!-- Fil d'Ariane -->
      <div class="bg-white border-b border-gray-200" *ngIf="breadcrumbs.length > 0">
        <div class="mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center py-3 text-sm">
            <nav class="flex" aria-label="Breadcrumb">
              <ol class="flex items-center space-x-4">
                <li *ngFor="let crumb of breadcrumbs; let last = last">
                  <div class="flex items-center">
                    <a *ngIf="!last" [routerLink]="crumb.url" 
                       class="text-gray-500 hover:text-gray-700">{{ crumb.label }}</a>
                    <span *ngIf="last" class="text-gray-900 font-medium">{{ crumb.label }}</span>
                    <svg *ngIf="!last" class="flex-shrink-0 h-4 w-4 text-gray-300 mx-3" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t border-gray-200 mt-auto">
        <div class="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <p class="text-sm text-gray-500">© 2025 Portail Scolaire. Tous droits réservés.</p>
            <div class="flex space-x-4">
              <a href="#" class="text-sm text-gray-500 hover:text-gray-700">Aide</a>
              <a href="#" class="text-sm text-gray-500 hover:text-gray-700">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styleUrls: ['./enseignant-layout.component.css']
})
export class EnseignantLayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  showUserMenu = false;
  showMobileMenu = false;
  notificationCount = 3;
  breadcrumbs: Array<{label: string, url: string}> = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // CORRECTION 1: Charger l'utilisateur actuel avec gestion des types
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        // Assurer la compatibilité des types
        this.currentUser = user ? {
          ...user,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString()
        } : null;
      });

    // CORRECTION 2: Écouter les changements de route avec typage correct
    this.router.events
      .pipe(
        filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.updateBreadcrumbs(event.url);
      });

    // Fermer les menus au clic extérieur
    document.addEventListener('click', this.closeMenus.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.closeMenus.bind(this));
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showMobileMenu = false;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    this.showUserMenu = false;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  private closeMenus(event: Event): void {
    if (!(event.target as Element).closest('.relative')) {
      this.showUserMenu = false;
      this.showMobileMenu = false;
    }
  }

  private updateBreadcrumbs(url: string): void {
    this.breadcrumbs = [];
    
    if (url.includes('dashboard')) {
      this.breadcrumbs = [
        { label: 'Accueil', url: '/enseignant/dashboard' }
      ];
    } else if (url.includes('notes')) {
      this.breadcrumbs = [
        { label: 'Accueil', url: '/enseignant/dashboard' },
        { label: 'Gestion des notes', url: '/enseignant/notes' }
      ];
    } else if (url.includes('classes')) {
      this.breadcrumbs = [
        { label: 'Accueil', url: '/enseignant/dashboard' },
        { label: 'Mes classes', url: '/enseignant/classes' }
      ];
    } else if (url.includes('matieres')) {
      this.breadcrumbs = [
        { label: 'Accueil', url: '/enseignant/dashboard' },
        { label: 'Mes matières', url: '/enseignant/matieres' }
      ];
    }
  }
}