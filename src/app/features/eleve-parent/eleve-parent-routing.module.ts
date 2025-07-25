import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EleveDashboardComponent } from './dashboard/dashboard.component'; // ✅ Corrigé : utilise le bon nom d'export

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: EleveDashboardComponent }, // ✅ Corrigé
  { path: 'bulletins', component: EleveDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EleveParentRoutingModule {}