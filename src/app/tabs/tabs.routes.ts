import { Routes } from '@angular/router';

export const tabsRoutes: Routes = [
  {
    path: 'broadcast',
    loadComponent: () => import('../pages/broadcast/broadcast.page').then(m => m.BroadcastPage),
  },
  {
    path: 'scoreboard',
    loadComponent: () => import('../pages/scoreboard/scoreboard.page').then(m => m.ScoreboardPage),
  },
  {
    path: 'management',
    loadComponent: () => import('../pages/management/management.page').then(m => m.ManagementPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('../pages/settings/settings.page').then(m => m.SettingsPage),
  },
  {
    path: '',
    redirectTo: localStorage.getItem('token') ? 'settings' : 'start',
    pathMatch: 'full',
  }
];
