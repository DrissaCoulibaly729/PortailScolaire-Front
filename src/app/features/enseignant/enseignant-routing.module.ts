import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnseignantEnseignantDashboardComponent } from './dashboard/dashboard.component'; // ✅ Supposé nom correct du composant

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: EnseignantEnseignantDashboardComponent }, // ✅ Corrigé
  { path: 'notes', loadChildren: () => import('./notes/notes.module').then(m => m.NotesModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnseignantRoutingModule {}