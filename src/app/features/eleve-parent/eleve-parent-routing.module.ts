import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EleveLayoutComponent } from '../../layouts/eleve-layout/eleve-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BulletinListComponent } from './bulletins/bulletin-list/bulletin-list.component';
import { BulletinDetailComponent } from './bulletins/bulletin-detail/bulletin-detail.component';

const routes: Routes = [
  {
    path: '',
    component: EleveLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { 
        path: 'bulletins', 
        children: [
          { path: '', component: BulletinListComponent },
          { path: 'detail/:id', component: BulletinDetailComponent }
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
export class EleveParentRoutingModule { }