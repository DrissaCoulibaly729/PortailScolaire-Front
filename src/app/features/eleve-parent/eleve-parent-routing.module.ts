import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EleveEleveDashboardComponent } from './dashboard/dashboard.component'; // ✅ Corrigé : utilise le bon nom d'export

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: EleveEleveDashboardComponent }, // ✅ Corrigé
  { path: 'bulletins', loadChildren: () => import('./bulletins/bulletins.module').then(m => m.BulletinsModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EleveParentRoutingModule {}