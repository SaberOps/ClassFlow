import { Routes } from '@angular/router';

export const ADMIN_USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-list.component').then((m) => m.UserListComponent),
  },
];
