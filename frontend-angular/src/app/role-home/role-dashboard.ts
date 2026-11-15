import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthResponse, AuthService, homePathForRole, UserRole } from '../auth/auth.service';

function isUserRole(value: unknown): value is UserRole {
  return value === 'ADMIN' || value === 'TEACHER' || value === 'STUDENT';
}

@Component({
  imports: [RouterLink],
  selector: 'app-role-dashboard',
  templateUrl: './role-dashboard.html',
})
export class RoleDashboard implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly requiredRole: UserRole;
  user: AuthResponse | null = null;
  notice = '';
  isLoading = true;
  isLoggingOut = false;

  constructor() {
    const role = this.route.snapshot.data['role'];
    if (!isUserRole(role)) {
      throw new Error('Role dashboard route is missing a valid role.');
    }
    this.requiredRole = role;
  }

  ngOnInit(): void {
    this.auth.currentUser().subscribe({
      next: (user) => {
        this.isLoading = false;
        if (user.role !== this.requiredRole) {
          void this.router.navigateByUrl(homePathForRole(user.role), { replaceUrl: true });
          return;
        }
        this.user = user;
      },
      error: (error: unknown) => {
        this.isLoading = false;
        if (error instanceof HttpErrorResponse && error.status === 401) {
          void this.router.navigateByUrl('/login');
          return;
        }
        this.notice = 'Impossible de charger votre session. Réessayez.';
      },
    });
  }

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => {
        this.isLoggingOut = false;
        this.notice = 'La déconnexion a échoué. Réessayez.';
      },
    });
  }
}
