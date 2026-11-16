
import { Routes } from '@angular/router';
import { studentGuard } from './student.guard';
import { StudentLayoutComponent } from './layouts/student-layout/student-layout.component';

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
    path: 'admin/teachers/new',
    loadComponent: () =>
      import('./features/admin/teachers/teacher-create.component').then(
        (m) => m.TeacherCreateComponent
      ),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
  {
    path: 'student',
    canActivate: [studentGuard],
    component: StudentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/student/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'courses', loadComponent: () => import('./features/student/courses/courses.component').then(m => m.CoursesComponent) },
      { path: 'courses/:id', loadComponent: () => import('./features/student/courses/course-detail.component').then(m => m.CourseDetailComponent) },
      { path: 'assignments', loadComponent: () => import('./features/student/assignments/assignments.component').then(m => m.AssignmentsComponent) },
      { path: 'assignments/:id', loadComponent: () => import('./features/student/assignments/assignment-detail.component').then(m => m.AssignmentDetailComponent) },
      { path: 'grades', loadComponent: () => import('./features/student/assignments/grades.component').then(m => m.GradesComponent) },
      { path: 'timetable', loadComponent: () => import('./features/student/timetable/timetable.component').then(m => m.TimetableComponent) },
      { path: 'attendance', loadComponent: () => import('./features/student/attendance/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'request-documents', loadComponent: () => import('./features/student/resources/request-documents.component').then(m => m.RequestDocumentsComponent) },
      { path: 'notifications', loadComponent: () => import('./features/student/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'teachers', loadComponent: () => import('./features/student/messaging/teachers.component').then(m => m.TeachersComponent) },
      { path: 'profile', loadComponent: () => import('./features/student/profile/profile.component').then(m => m.ProfileComponent) }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
