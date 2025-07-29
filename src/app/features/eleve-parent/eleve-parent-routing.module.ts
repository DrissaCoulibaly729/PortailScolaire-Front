// src/app/features/eleve-parent/eleve-parent-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EleveLayoutComponent } from '../../layouts/eleve-layout/eleve-layout.component';

// Import des composants (à créer/compléter)
import { EleveDashboardComponent } from './dashboard/dashboard.component';
import { BulletinListComponent } from './bulletins/bulletin-list/bulletin-list.component';
import { BulletinDetailComponent } from './bulletins/bulletin-detail/bulletin-detail.component';
import { EleveNotesComponent } from './notes/eleve-notes/eleve-notes.component';
import { EleveDetailComponent } from './profile/eleve-detail/eleve-detail.component';
import { EleveEditComponent } from './profile/eleve-edit/eleve-edit.component';
// import { EleveAbsencesComponent } from './absences/eleve-absences.component';
// import { ElevePlanningComponent } from './planning/eleve-planning.component';

const routes: Routes = [
  {
    path: '',
    component: EleveLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // 📊 Dashboard
      { path: 'dashboard', component: EleveDashboardComponent },
      
      // 📋 Bulletins
      { path: 'bulletins', component: BulletinListComponent },
      { path: 'bulletins/:id', component: BulletinDetailComponent },
      { path: 'bulletins/:id/download', component: BulletinDetailComponent }, // Pour téléchargement
      
      // 📝 Notes
      { path: 'notes', component: EleveNotesComponent },
      { path: 'notes/:matiereId', component: EleveNotesComponent }, // Notes par matière
      
      // 👤 Profil élève/parent
      { path: 'profile', component: EleveDetailComponent },
      { path: 'profile/edit', component: EleveEditComponent },
      
      // 📅 Planning et absences
      // { path: 'planning', component: ElevePlanningComponent },
      // { path: 'absences', component: EleveAbsencesComponent },
      
      // 📧 Communications (si nécessaire)
      { path: 'communications', loadChildren: () => import('./communications/communications.module').then(m => m.CommunicationsModule) },
      
      // 🔄 Redirections pour les anciennes routes
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EleveParentRoutingModule {}