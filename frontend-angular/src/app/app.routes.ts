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
  {
    path: 'home',
    loadComponent: () => import('./role-home/role-home').then((m) => m.RoleHome),
  },
  {
    path: 'admin/home',
    loadComponent: () => import('./role-home/role-dashboard').then((m) => m.RoleDashboard),
    data: { role: 'ADMIN' },
  },
  {
    path: 'teacher/home',
    loadComponent: () => import('./role-home/role-dashboard').then((m) => m.RoleDashboard),
    data: { role: 'TEACHER' },
  },
  {
    path: 'student/home',
    loadComponent: () => import('./role-home/role-dashboard').then((m) => m.RoleDashboard),
    data: { role: 'STUDENT' },
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
