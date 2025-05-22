import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: localStorage.getItem('token') ? 'tabs/settings' : 'start',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.tabsRoutes),
  },
  {
    path: 'start',
    loadComponent: () => import('./pages/start/start.page').then(m => m.StartPage),
  },
  {
    path: 'join-event',
    loadComponent: () => import('./pages/join-event/join-event.component').then(m => m.JoinEventComponent)
  }
  
];