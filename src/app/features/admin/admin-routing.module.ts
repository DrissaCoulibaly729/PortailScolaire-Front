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
      { path: 'dashboard', component: DashboardComponent },
      { 
        path: 'users', 
        children: [
          { path: '', component: UserListComponent },
          { path: 'create', component: UserFormComponent },
          { path: 'edit/:id', component: UserFormComponent }
        ]
      },
      { 
        path: 'classes', 
        children: [
          { path: '', component: ClasseListComponent },
          { path: 'create', component: ClasseFormComponent },
          { path: 'edit/:id', component: ClasseFormComponent }
        ]
      },
      { 
        path: 'matieres', 
        children: [
          { path: '', component: MatiereListComponent },
          { path: 'create', component: MatiereFormComponent },
          { path: 'edit/:id', component: MatiereFormComponent }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }