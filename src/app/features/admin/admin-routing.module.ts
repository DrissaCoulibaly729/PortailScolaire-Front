// src/app/features/admin/admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from '../../layouts/admin-layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserFormComponent } from './users/user-form/user-form.component';
import { UserDetailComponent } from './users/user-detail/user-detail.component'; // ✅ AJOUT
import { EnseignantManagementComponent } from './users/enseignant-management/enseignant-management.component'; // ✅ NOUVEAU AJOUT
import { ClasseListComponent } from './classes/classe-list/classe-list.component';
import { ClasseFormComponent } from './classes/classe-form/classe-form.component';
import { MatiereListComponent } from './matieres/matiere-list/matiere-list.component';
import { MatiereFormComponent } from './matieres/matiere-form/matiere-form.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      
      // ✅ Routes utilisateurs complètes
      { path: 'utilisateurs', component: UserListComponent },
      { path: 'utilisateurs/create', component: UserFormComponent },
      { path: 'utilisateurs/enseignants', component: EnseignantManagementComponent }, // ✅ NOUVEAU - Gestion spécialisée des enseignants
      { path: 'utilisateurs/:id', component: UserDetailComponent }, // ✅ AJOUT pour voir les détails
      { path: 'utilisateurs/:id/edit', component: UserFormComponent },
      
      // ✅ Route alternative pour accès direct aux enseignants
      { path: 'enseignants', redirectTo: 'utilisateurs/enseignants', pathMatch: 'full' }, // ✅ NOUVEAU - Raccourci
      
      // Routes classes
      { path: 'classes', component: ClasseListComponent },
      { path: 'classes/create', component: ClasseFormComponent },
      { path: 'classes/:id', component: ClasseListComponent }, // Pour les détails de classe
      { path: 'classes/:id/edit', component: ClasseFormComponent },
      
      // Routes matières
      { path: 'matieres', component: MatiereListComponent },
      { path: 'matieres/create', component: MatiereFormComponent },
      { path: 'matieres/:id', component: MatiereListComponent }, // Pour les détails de matière
      { path: 'matieres/:id/edit', component: MatiereFormComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}