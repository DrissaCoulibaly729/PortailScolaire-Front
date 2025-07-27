// src/app/features/enseignant/enseignant-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EnseignantLayoutComponent } from '../../layouts/enseignant-layout/enseignant-layout.component';
import { EnseignantDashboardComponent } from './dashboard/dashboard.component';
import { NoteListComponent } from './notes/note-list/note-list.component';
import { NoteFormComponent } from './notes/note-form/note-form.component';
import { ClasseListComponent } from './classes/classe-list/classe-list.component';
import { ClasseDetailComponent } from './classes/classe-detail/classe-detail.component';
import { MatiereListComponent } from './matieres/matiere-list/matiere-list.component';
import { MatiereDetailComponent } from './matieres/matiere-detail/matiere-detail.component';

const routes: Routes = [
  {
    path: '',
    component: EnseignantLayoutComponent,
    children: [
      { 
        path: '', 
        redirectTo: 'dashboard', 
        pathMatch: 'full' 
      },
      { 
        path: 'dashboard', 
        component: EnseignantDashboardComponent,
        data: { title: 'Tableau de bord' }
      },
      {
        path: 'notes',
        children: [
          { 
            path: '', 
            component: NoteListComponent,
            data: { title: 'Gestion des notes' }
          },
          { 
            path: 'new', 
            component: NoteFormComponent,
            data: { title: 'Nouvelle note' }
          },
          { 
            path: 'edit/:id', 
            component: NoteFormComponent,
            data: { title: 'Modifier la note' }
          },
          {
            path: 'batch',
            component: NoteFormComponent,
            data: { title: 'Saisie en lot', mode: 'batch' }
          }
        ]
      },
      {
        path: 'classes',
        children: [
          { 
            path: '', 
            component: ClasseListComponent,
            data: { title: 'Mes classes' }
          },
          { 
            path: ':id', 
            component: ClasseDetailComponent,
            data: { title: 'Détail de la classe' }
          }
        ]
      },
      {
        path: 'matieres',
        children: [
          { 
            path: '', 
            component: MatiereListComponent,
            data: { title: 'Mes matières' }
          },
          { 
            path: ':id', 
            component: MatiereDetailComponent,
            data: { title: 'Détail de la matière' }
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnseignantRoutingModule {}