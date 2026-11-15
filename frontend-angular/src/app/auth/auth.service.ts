import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AuthResponse {
  email: string;
  role: UserRole;
}

export function homePathForRole(role: UserRole): string {
  return `/${role.toLowerCase()}/home`;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.loadCsrfToken().pipe(
      switchMap(() => this.http.post<AuthResponse>('/api/auth/login', { email, password })),
    );
  }

  currentUser(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('/api/auth/me');
  }

  logout(): Observable<void> {
    return this.loadCsrfToken().pipe(
      switchMap(() => this.http.post<void>('/api/auth/logout', {})),
    );
  }

  private loadCsrfToken(): Observable<unknown> {
    return this.http.get<unknown>('/api/auth/csrf');
  }
}
