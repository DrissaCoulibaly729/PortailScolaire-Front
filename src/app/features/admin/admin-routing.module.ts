import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from '../../layouts/admin-layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserFormComponent } from './users/user-form/user-form.component';
import { ClasseListComponent } from './classes/classe-list/classe-list.component';
import { ClasseFormComponent } from './classes/classe-form/classe-form.component';
import { MatiereListComponent } from './matieres/matiere-list/matiere-list.component';
import { MatiereFormComponent } from './matieres/matiere-form/matiere-form.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { 
        path: 'dashboard', 
        component: DashboardComponent,
        data: { title: 'Tableau de bord' }
      },
      { 
        path: 'users', 
        children: [
          { 
            path: '', 
            component: UserListComponent,
            data: { title: 'Liste des utilisateurs' }
          },
          { 
            path: 'create', 
            component: UserFormComponent,
            data: { title: 'Créer un utilisateur' }
          },
          { 
            path: 'edit/:id', 
            component: UserFormComponent,
            data: { title: 'Modifier un utilisateur' }
          }
        ]
      },
      { 
        path: 'classes', 
        children: [
          { 
            path: '', 
            component: ClasseListComponent,
            data: { title: 'Liste des classes' }
          },
          { 
            path: 'create', 
            component: ClasseFormComponent,
            data: { title: 'Créer une classe' }
          },
          { 
            path: 'edit/:id', 
            component: ClasseFormComponent,
            data: { title: 'Modifier une classe' }
          }
        ]
      },
      { 
        path: 'matieres', 
        children: [
          { 
            path: '', 
            component: MatiereListComponent,
            data: { title: 'Liste des matières' }
          },
          { 
            path: 'create', 
            component: MatiereFormComponent,
            data: { title: 'Créer une matière' }
          },
          { 
            path: 'edit/:id', 
            component: MatiereFormComponent,
            data: { title: 'Modifier une matière' }
          }
        ]
      },
      { 
        path: '', 
        redirectTo: 'dashboard', 
        pathMatch: 'full' 
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
