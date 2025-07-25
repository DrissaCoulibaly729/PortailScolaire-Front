import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EleveLayoutComponent } from '../../layouts/eleve-layout/eleve-layout.component';
import { EleveDashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: EleveLayoutComponent, // ✅ AJOUT DU LAYOUT
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: EleveDashboardComponent },
      { path: 'bulletins', component: EleveDashboardComponent } // Remplacez par le bon composant
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EleveParentRoutingModule {}