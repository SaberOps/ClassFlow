import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService, homePathForRole } from './auth/auth.service';

export const studentGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.currentUser().pipe(
    map(user => {
      if (user.role !== 'STUDENT') return router.createUrlTree([homePathForRole(user.role)]);
      const passwordRoute = state.url.startsWith('/student/change-password');
      if (user.mustChangePassword && !passwordRoute) {
        return router.createUrlTree(['/student/change-password']);
      }
      if (!user.mustChangePassword && passwordRoute) {
        return router.createUrlTree(['/student/dashboard']);
      }
      return true;
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
