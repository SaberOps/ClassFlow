import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminUser, PageResponse, UpdateUserPayload, UserFilters } from './user.model';

/** Calls the US11 endpoints. Relative URLs: the dev proxy forwards /api to Spring Boot. */
@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/admin/users';

  list(filters: UserFilters): Observable<PageResponse<AdminUser>> {
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    if (filters.q?.trim()) params = params.set('q', filters.q.trim());
    if (filters.role) params = params.set('role', filters.role);
    if (filters.enabled !== undefined) params = params.set('enabled', filters.enabled);
    return this.http.get<PageResponse<AdminUser>>(this.baseUrl, { params });
  }

  update(id: number, payload: UpdateUserPayload): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/${id}`, payload);
  }

  setEnabled(id: number, enabled: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/${id}/status`, { enabled });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

/** Extracts the readable message the backend puts in the "detail" field (409, 404...). */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const detail = err.error?.detail;
    if (typeof detail === 'string' && detail) return detail;
    if (err.status === 0) return 'Server unreachable. Check that the backend is running.';
    if (err.status === 403) return 'You are not allowed to perform this action.';
    if (err.status === 401) return 'Your session has expired. Please sign in again.';
  }
  return 'Unexpected error. Please try again.';
}
