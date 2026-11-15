import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin/users',
    loadChildren: () =>
      import('./features/admin/users/admin-users.routes').then(
        (m) => m.ADMIN_USERS_ROUTES
      ),
  },
  {
    path: 'admin/teachers/new',
    loadComponent: () =>
      import('./features/admin/teachers/teacher-create.component').then(
        (m) => m.TeacherCreateComponent
      ),
  },
  { path: '', redirectTo: 'admin/users', pathMatch: 'full' },
  { path: '**', redirectTo: 'admin/users' },
];