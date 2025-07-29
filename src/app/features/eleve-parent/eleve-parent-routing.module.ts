// src/app/features/eleve-parent/eleve-parent-routing.module.ts (CORRIGÉ)
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EleveLayoutComponent } from '../../layouts/eleve-layout/eleve-layout.component';

// Import des composants
import { EleveDashboardComponent } from './dashboard/dashboard.component';
import { BulletinListComponent } from './bulletins/bulletin-list/bulletin-list.component';
import { BulletinDetailComponent } from './bulletins/bulletin-detail/bulletin-detail.component';
import { EleveNotesComponent } from './notes/eleve-notes/eleve-notes.component';
import { EleveDetailComponent } from './profile/eleve-detail/eleve-detail.component';
import { EleveEditComponent } from './profile/eleve-edit/eleve-edit.component';

const routes: Routes = [
  {
    path: '',
    component: EleveLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // 📊 Dashboard
      { path: 'dashboard', component: EleveDashboardComponent },
      
      // 📋 Bulletins - ROUTES CORRIGÉES
      { path: 'bulletins', component: BulletinListComponent },
      { 
        path: 'bulletins/:id', 
        component: BulletinDetailComponent,
        data: { title: 'Détail du bulletin' }
      },
      { 
        path: 'bulletins/:id/edit', 
        component: BulletinDetailComponent, // Ou un composant d'édition séparé
        data: { title: 'Modifier le bulletin', mode: 'edit' }
      },
      { 
        path: 'bulletins/:id/download', 
        component: BulletinDetailComponent,
        data: { title: 'Télécharger le bulletin', mode: 'download' }
      },
      
      // 📝 Notes
      { path: 'notes', component: EleveNotesComponent },
      { path: 'notes/:matiereId', component: EleveNotesComponent },
      
      // 👤 Profil élève/parent
      { path: 'profile', component: EleveDetailComponent },
      { path: 'profile/edit', component: EleveEditComponent },
      
      // 📧 Communications (chargement paresseux)
      { 
        path: 'communications', 
        loadChildren: () => import('./communications/communications.module')
          .then(m => m.CommunicationsModule)
          .catch(() => {
            console.warn('Module communications non trouvé, redirection vers dashboard');
            return import('./dashboard/dashboard.component').then(c => ({
              default: c.EleveDashboardComponent
            }));
          })
      },
      
      // 🔄 Redirections pour les anciennes routes et erreurs
      { path: 'bulletin/:id', redirectTo: 'bulletins/:id' }, // Ancienne route
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EleveParentRoutingModule {}

