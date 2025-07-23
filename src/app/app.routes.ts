import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { enseignantGuard } from './core/guards/enseignant.guard';
import { eleveGuard } from './core/guards/eleve.guard';

export const routes: Routes = [
  // Redirection par défaut
  { 
    path: '', 
    redirectTo: '/auth/login', 
    pathMatch: 'full' 
  },
  
  // Routes d'authentification
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  
  // Routes administrateur
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [adminGuard]
  },
  
  // Routes enseignant
  {
    path: 'enseignant',
    loadChildren: () => import('./features/enseignant/enseignant.module').then(m => m.EnseignantModule),
    canActivate: [enseignantGuard]
  },
  
  // Routes élève/parent
  {
    path: 'eleve',
    loadChildren: () => import('./features/eleve-parent/eleve-parent.module').then(m => m.EleveParentModule),
    canActivate: [eleveGuard]
  },
  
  // Route 404 - Page non trouvée
  { 
    path: '**', 
    redirectTo: '/auth/login'
  }
];
