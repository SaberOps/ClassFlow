import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService, homePathForRole } from '../../auth/auth.service';

export const teacherGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.currentUser().pipe(
    map(user => {
      if (user.role !== 'TEACHER') return router.createUrlTree([homePathForRole(user.role)]);
      const passwordRoute = state.url.startsWith('/teacher/change-password');
      if (user.mustChangePassword && !passwordRoute) {
        return router.createUrlTree(['/teacher/change-password']);
      }
      if (!user.mustChangePassword && passwordRoute) {
        return router.createUrlTree(['/teacher/dashboard']);
      }
      return true;
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
