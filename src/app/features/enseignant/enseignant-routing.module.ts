import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnseignantLayoutComponent } from '../../layouts/enseignant-layout/enseignant-layout.component';
import { EnseignantDashboardComponent } from './dashboard/dashboard.component';
import { NoteListComponent } from './notes/note-list/note-list.component';
import { NoteFormComponent } from './notes/note-form/note-form.component';
// import { NoteDetailComponent } from './notes/note-detail/note-detail.component';
// import { NoteBatchComponent } from './notes/note-batch/note-batch.component';
// import { NoteImportComponent } from './notes/note-import/note-import.component';

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
          { path: '', component: NoteListComponent }, // ✅ Liste des notes
          { path: 'create', component: NoteFormComponent }, // ✅ Créer une note
          // { path: 'batch', component: NoteBatchComponent }, // ✅ Saisie en lot
          // { path: 'import', component: NoteImportComponent }, // ✅ Import CSV
          // { path: 'edit/:id', component: NoteFormComponent }, // ✅ Modifier une note
          // { path: ':id', component: NoteDetailComponent } // ✅ Détail d'une note
        ]
      },
      
      // Gestion des classes (composants à créer si pas encore fait)
      { 
        path: 'classes', 
        children: [
          { path: '', component: EnseignantDashboardComponent }, // Temporaire - Liste des classes
          { path: ':id', component: EnseignantDashboardComponent } // Temporaire - Détail d'une classe
        ]
      },
      
      // Gestion des matières
      { 
        path: 'matieres',
        children: [
          { path: '', component: EnseignantDashboardComponent }, // Temporaire - Liste des matières
          { path: ':id', component: EnseignantDashboardComponent } // Temporaire - Détail d'une matière
        ]
      },
      
      // Gestion des bulletins
      { 
        path: 'bulletins',
        children: [
          { path: '', component: EnseignantDashboardComponent }, // Temporaire - Liste des bulletins
          { path: 'generate/:eleveId', component: EnseignantDashboardComponent }, // Générer bulletin
          { path: ':id', component: EnseignantDashboardComponent } // Détail bulletin
        ]
      },
      
      // Gestion des élèves (via classes)
      { 
        path: 'eleves',
        children: [
          { path: '', redirectTo: '/enseignant/classes', pathMatch: 'full' }, // Redirection vers classes
          { path: ':id', component: EnseignantDashboardComponent } // Profil élève
        ]
      },
      
      // Rapports et statistiques
      { 
        path: 'rapports',
        children: [
          { path: '', component: EnseignantDashboardComponent }, // Tableau de bord rapports
          { path: 'classe/:id', component: EnseignantDashboardComponent }, // Rapport par classe
          { path: 'matiere/:id', component: EnseignantDashboardComponent }, // Rapport par matière
          { path: 'export', component: EnseignantDashboardComponent } // Export données
        ]
      },
      
      // Profil enseignant
      { path: 'profile', component: EnseignantDashboardComponent }, // Composant profil à créer
      
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