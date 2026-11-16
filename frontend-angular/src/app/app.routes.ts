
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/password-reset/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/password-reset/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'home',
    loadComponent: () => import('./role-home/role-home').then((m) => m.RoleHome),
  },
  {
    path: 'admin/home',
    loadComponent: () =>
      import('./role-home/role-dashboard').then((m) => m.RoleDashboard),
    data: { role: 'ADMIN' },
  },
  {
    path: 'teacher/home',
    loadComponent: () =>
      import('./role-home/role-dashboard').then((m) => m.RoleDashboard),
    data: { role: 'TEACHER' },
  },
  {
    path: 'student/home',
    loadComponent: () =>
      import('./role-home/role-dashboard').then((m) => m.RoleDashboard),
    data: { role: 'STUDENT' },
  },
  {
    path: 'admin/users',
    loadChildren: () =>
      import('./features/admin/users/admin-users.routes').then(
        (m) => m.ADMIN_USERS_ROUTES
      ),
  },
  {
    path: 'admin/filieres',
    loadComponent: () =>
      import('./features/admin/academic/filiere-management.component').then(
        (m) => m.FiliereManagementComponent
      ),
  },
  {
    path: 'admin/teachers/new',
    loadComponent: () =>
      import('./features/admin/teachers/teacher-create.component').then(
        (m) => m.TeacherCreateComponent
      ),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
