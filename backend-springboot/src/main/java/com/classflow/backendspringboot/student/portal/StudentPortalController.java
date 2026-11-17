import { Routes } from '@angular/router';
import { studentGuard } from './student.guard';
import { teacherGuard } from './core/guards/teacher.guard';
import { StudentLayoutComponent } from './layouts/student-layout/student-layout.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/password-reset/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/password-reset/reset-password.component')
      .then(m => m.ResetPasswordComponent)
  },
  { path: 'home', loadComponent: () => import('./role-home/role-home').then(m => m.RoleHome) },
  {
    path: 'admin/home',
    loadComponent: () => import('./role-home/role-dashboard').then(m => m.RoleDashboard),
    data: { role: 'ADMIN' }
  },
  {
    path: 'admin/announcements',
    loadComponent: () => import('./features/admin/announcements/admin-announcements.component')
      .then(m => m.AdminAnnouncementsComponent)
  },
  {
    path: 'teacher/home',
    pathMatch: 'full',
    redirectTo: 'teacher/dashboard'
  },
  {
    path: 'student/home',
    pathMatch: 'full',
    redirectTo: 'student/dashboard'
  },
  {
    path: 'admin/users/new',
    loadComponent: () => import('./features/admin/teachers/teacher-create.component')
      .then(m => m.TeacherCreateComponent)
  },
  {
    path: 'admin/users',
    loadChildren: () => import('./features/admin/users/admin-users.routes').then(m => m.ADMIN_USERS_ROUTES)
  },
  {
    path: 'admin/filieres',
    loadComponent: () =>
      import('./features/admin/academic/filiere-management.component').then(
        (m) => m.FiliereManagementComponent
      ),
  },
  {
    path: 'admin/timetable',
    loadComponent: () =>
      import('./features/admin/timetable/admin-timetable.component')
        .then(m => m.AdminTimetableComponent)
  },
  {
    path: 'admin/teachers/new',
    pathMatch: 'full',
    redirectTo: 'admin/users/new'
  },
  {
    path: 'student/change-password',
    canActivate: [studentGuard],
    loadComponent: () =>
      import('./features/student/profile/student-change-password.component')
        .then(m => m.StudentChangePasswordComponent)
  },
  {
    path: 'teacher',
    canActivate: [teacherGuard],
    canActivateChild: [teacherGuard],
    loadComponent: () => import('./layouts/teacher-layout/teacher-layout.component')
      .then(m => m.TeacherLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/teacher/dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent) },
      { path: 'courses', loadComponent: () => import('./features/teacher/courses/teacher-courses.component').then(m => m.TeacherCoursesComponent) },
      { path: 'assignments', loadComponent: () => import('./features/teacher/assignments/teacher-assignments.component').then(m => m.TeacherAssignmentsComponent) },
      { path: 'timetable', loadComponent: () => import('./features/teacher/timetable/teacher-timetable.component').then(m => m.TeacherTimetableComponent) },
      { path: 'attendance', loadComponent: () => import('./features/teacher/attendance/teacher-attendance.component').then(m => m.TeacherAttendanceComponent) },
      { path: 'notifications', loadComponent: () => import('./features/teacher/notifications/teacher-notifications.component').then(m => m.TeacherNotificationsComponent) },
      { path: 'profile', loadComponent: () => import('./features/teacher/profile/teacher-profile.component').then(m => m.TeacherProfileComponent) },
      { path: 'change-password', loadComponent: () => import('./features/teacher/profile/teacher-change-password.component').then(m => m.TeacherChangePasswordComponent) }
    ]
  },
  {
    path: 'student',
    canActivate: [studentGuard],
    canActivateChild: [studentGuard],
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
      { path: 'messages', loadComponent: () => import('./features/student/messaging/messages.component').then(m => m.MessagesComponent) },
      { path: 'feed', loadComponent: () => import('./features/student/feed/feed.component').then(m => m.FeedComponent) },
      { path: 'profile', loadComponent: () => import('./features/student/profile/profile.component').then(m => m.ProfileComponent) }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];
