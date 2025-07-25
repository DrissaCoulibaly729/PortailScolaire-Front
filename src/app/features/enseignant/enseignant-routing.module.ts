import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnseignantLayoutComponent } from '../../layouts/enseignant-layout/enseignant-layout.component';
import { EnseignantDashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: EnseignantLayoutComponent, // ✅ AJOUT DU LAYOUT
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: EnseignantDashboardComponent },
      { path: 'notes', component: EnseignantDashboardComponent } // Remplacez par le bon composant
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnseignantRoutingModule {}