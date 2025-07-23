import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnseignantLayoutComponent } from '../../layouts/enseignant-layout/enseignant-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NoteListComponent } from './notes/note-list/note-list.component';
import { NoteFormComponent } from './notes/note-form/note-form.component';

const routes: Routes = [
  {
    path: '',
    component: EnseignantLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { 
        path: 'notes', 
        children: [
          { path: '', component: NoteListComponent },
          { path: 'create', component: NoteFormComponent },
          { path: 'edit/:id', component: NoteFormComponent }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnseignantRoutingModule { }