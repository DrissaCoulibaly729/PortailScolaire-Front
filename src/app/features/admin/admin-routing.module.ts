import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from '../../layouts/admin-layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserFormComponent } from './users/user-form/user-form.component'; // ✅ Corrigé
import { ClasseListComponent } from './classes/classe-list/classe-list.component';
import { ClasseFormComponent } from './classes/classe-form/classe-form.component';
import { MatiereListComponent } from './matieres/matiere-list/matiere-list.component';
import { MatiereFormComponent } from './matieres/matiere-form/matiere-form.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent, // ✅ AJOUT DU LAYOUT
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      
      // Routes utilisateurs
      { path: 'utilisateurs', component: UserListComponent },
      { path: 'utilisateurs/create', component: UserFormComponent },
      { path: 'utilisateurs/:id/edit', component: UserFormComponent },
      
      // Routes classes
      { path: 'classes', component: ClasseListComponent },
      { path: 'classes/create', component: ClasseFormComponent },
      { path: 'classes/:id/edit', component: ClasseFormComponent },
      
      // Routes matières
      { path: 'matieres', component: MatiereListComponent },
      { path: 'matieres/create', component: MatiereFormComponent },
      { path: 'matieres/:id/edit', component: MatiereFormComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}