import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnseignantLayoutComponent } from '../../layouts/enseignant-layout/enseignant-layout.component';
import { EnseignantDashboardComponent } from './dashboard/dashboard.component';
import { NoteListComponent } from './notes/note-list/note-list.component';
import { ClasseListComponent } from './classes/classe-list/classe-list.component';
import { ClasseDetailComponent } from './classes/classe-detail/classe-detail.component';

const routes: Routes = [
  {
    path: '',
    component: EnseignantLayoutComponent, // ✅ Layout enseignant
    children: [
      // Route par défaut
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // Dashboard principal
      { path: 'dashboard', component: EnseignantDashboardComponent },
      
      // Gestion des notes
      { 
        path: 'notes', 
        children: [
          { path: '', component: NoteListComponent }, // Liste des notes
          { path: 'create', component: NoteListComponent }, // Créer une note (composant à créer)
          { path: 'edit/:id', component: NoteListComponent }, // Modifier une note (composant à créer)
          { path: ':id', component: NoteListComponent } // Détail d'une note (composant à créer)
        ]
      },
      
      // Gestion des classes
      { 
        path: 'classes', 
        children: [
          { path: '', component: ClasseListComponent }, // ✅ Liste des classes
          { path: ':id', component: ClasseDetailComponent } // ✅ Détail d'une classe avec ID
        ]
      },
      
      // Gestion des élèves (routes futures)
      { 
        path: 'eleves',
        children: [
          { path: '', redirectTo: '/enseignant/classes', pathMatch: 'full' }, // Redirection vers classes
          { path: ':id', component: ClasseDetailComponent } // Profil élève (composant à créer)
        ]
      },
      
      // Rapports et statistiques (routes futures)
      { 
        path: 'rapports',
        children: [
          { path: '', component: EnseignantDashboardComponent }, // Composant rapports à créer
          { path: 'classe/:id', component: ClasseDetailComponent }, // Rapport par classe
          { path: 'export', component: EnseignantDashboardComponent } // Export (composant à créer)
        ]
      },
      
      // Mes matières (route future)
      { path: 'mes-matieres', component: EnseignantDashboardComponent },
      
      // Route wildcard - redirection vers dashboard si route inconnue
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnseignantRoutingModule {}