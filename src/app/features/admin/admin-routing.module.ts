import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { ClasseFormComponent } from './users/user-form/user-form.component'; // ✅ Corrigé : utilise le bon nom d'export
import { ClasseListComponent } from './classes/classe-list/classe-list.component';
import { MatiereListComponent } from './matieres/matiere-list/matiere-list.component';
import { MatiereFormComponent } from './matieres/matiere-form/matiere-form.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'utilisateurs', component: UserListComponent },
  { path: 'utilisateurs/create', component: ClasseFormComponent }, // ✅ Utilisé le bon composant
  { path: 'utilisateurs/:id/edit', component: ClasseFormComponent },
  { path: 'classes', component: ClasseListComponent },
  { path: 'matieres', component: MatiereListComponent },
  { path: 'matieres/create', component: MatiereFormComponent },
  { path: 'matieres/:id/edit', component: MatiereFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}