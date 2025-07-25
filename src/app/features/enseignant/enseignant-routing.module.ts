import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnseignantDashboardComponent } from './dashboard/dashboard.component'; // ✅ Supposé nom correct du composant

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: EnseignantDashboardComponent }, // ✅ Corrigé
  { path: 'notes', component: EnseignantDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnseignantRoutingModule {}