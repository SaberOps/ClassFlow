import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, homePathForRole } from '../auth/auth.service';

@Component({
  selector: 'app-role-home',
  templateUrl: './role-home.html',
})
export class RoleHome implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  notice = '';

  ngOnInit(): void {
    this.auth.currentUser().subscribe({
      next: (user) => {
        void this.router.navigateByUrl(homePathForRole(user.role), { replaceUrl: true });
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          void this.router.navigateByUrl('/login');
          return;
        }
        this.notice = 'Impossible de charger votre session. Réessayez.';
      },
    });
  }
}
