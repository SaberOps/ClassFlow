import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin/users',
    loadChildren: () =>
      import('./features/admin/users/admin-users.routes').then((m) => m.ADMIN_USERS_ROUTES),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
