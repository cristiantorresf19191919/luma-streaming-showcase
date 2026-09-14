import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/browse').then((m) => m.Browse),
    title: 'movie — Find your next escape',
  },
  ...['movies', 'series', 'list', 'search'].map((path) => ({
    path,
    loadComponent: () => import('./features/browse').then((m) => m.Browse),
    title: `${path === 'list' ? 'My List' : path.charAt(0).toUpperCase() + path.slice(1)} — movie`,
  })),
  { path: 'title/:id', loadComponent: () => import('./features/detail').then((m) => m.Detail) },
  { path: 'watch/:id', loadComponent: () => import('./features/player').then((m) => m.Player) },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile').then((m) => m.Profile),
    title: 'Your space — movie',
  },
  { path: '**', redirectTo: '' },
];
