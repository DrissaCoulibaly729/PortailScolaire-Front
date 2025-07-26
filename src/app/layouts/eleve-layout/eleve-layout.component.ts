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
  selector: 'app-eleve-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './eleve-layout.component.html',
  styleUrl: './eleve-layout.component.css'
})
export class EleveLayoutComponent implements OnInit {

  currentUser: User | null = null;
  isSidebarOpen = true;
  isProfileMenuOpen = false;

  // Navigation adaptée pour les élèves/parents
  navigationItems: NavigationItem[] = [
    {
      label: 'Tableau de bord',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-1 1V5H4v14h16v-2.586l1 1V19a1 1 0 01-1 1H4a1 1 0 01-1-1V4z',
      route: '/eleve/dashboard'
    },
    {
      label: 'Mes Notes',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/eleve/notes'
    },
    {
      label: 'Bulletins',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/eleve/bulletins'
    },
    {
      label: 'Planning',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      route: '/eleve/planning'
    },
    {
      label: 'Mes Enseignants',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      route: '/eleve/enseignants'
    },
    {
      label: 'Communications',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      route: '/eleve/communications'
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
   * Obtenir le rôle de l'utilisateur (Élève ou Parent)
   */
  getUserRole(): string {
    return this.currentUser?.role === 'eleve' ? 'Élève' : 'Parent';
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