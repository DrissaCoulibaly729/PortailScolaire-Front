import { Component, OnInit } from '@angular/core';
import { User } from '../../shared/models/auth.model';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

// Interface pour les éléments de navigation
interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-enseignant-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './enseignant-layout.component.html',
  styleUrl: './enseignant-layout.component.css'
})
export class EnseignantLayoutComponent implements OnInit {

  currentUser: User | null = null;
  isSidebarOpen = true;
  isProfileMenuOpen = false;

  // Navigation adaptée pour les enseignants
  navigationItems: NavigationItem[] = [
    {
      label: 'Tableau de bord',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-1 1V5H4v14h16v-2.586l1 1V19a1 1 0 01-1 1H4a1 1 0 01-1-1V4z',
      route: '/enseignant/dashboard'
    },
    {
      label: 'Mes Classes',
      icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM9 7h6m-6 4h6m-6 4h4',
      route: '/enseignant/classes'
    },
    {
      label: 'Gestion des Notes',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/enseignant/notes'
    },
    {
      label: 'Mes Élèves',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      route: '/enseignant/eleves'
    },
    {
      label: 'Rapports',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/enseignant/rapports'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements de l'utilisateur actuel
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Basculer l'état de la sidebar
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Basculer le menu profil
   */
  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  /**
   * Fermer le menu profil quand on clique ailleurs
   */
  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  /**
   * Obtenir les initiales de l'utilisateur
   */
  getUserInitials(): string {
    return this.authService.getUserInitials();
  }

  /**
   * Obtenir le nom complet de l'utilisateur
   */
  getUserFullName(): string {
    return this.authService.getUserFullName();
  }

  /**
   * Naviguer vers le profil
   */
  goToProfile(): void {
    this.router.navigate(['/auth/profile']);
    this.closeProfileMenu();
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Déconnexion réussie');
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
      }
    });
    this.closeProfileMenu();
  }

  /**
   * Vérifier si une route est active
   */
  isRouteActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}