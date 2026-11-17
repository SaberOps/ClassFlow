import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateTeacherRequest,
  TeacherCreatedResponse,
} from './teacher.model';

@Injectable({
  providedIn: 'root',
})
export class AdminTeacherService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = '/api/admin/teachers';

  createTeacher(
    request: CreateTeacherRequest
  ): Observable<TeacherCreatedResponse> {
    return this.http.post<TeacherCreatedResponse>(
      this.baseUrl,
      request
    );
  }
}

export function teacherApiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const detail = err.error?.detail;

    if (typeof detail === 'string' && detail) {
      return detail;
    }

    if (err.status === 0) {
      return 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';
    }

    if (err.status === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    }

    if (err.status === 403) {
      return 'Vous n’avez pas les droits nécessaires pour créer un enseignant.';
    }

    if (err.status === 409) {
      return 'Cette adresse e-mail est déjà utilisée.';
    }

    if (err.status === 400) {
      return 'Les informations saisies sont invalides.';
    }
  }

  return 'Une erreur inattendue est survenue. Réessayez.';
}