import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiErrorMessage } from '../users/admin-user.service';
import { AcademicClass, AcademicStudent, Filiere } from './academic.model';

@Injectable({ providedIn: 'root' })
export class AcademicAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/admin/filieres';

  list(): Observable<Filiere[]> {
    return this.http.get<Filiere[]>(this.baseUrl);
  }

  createFiliere(name: string): Observable<Filiere> {
    return this.http.post<Filiere>(this.baseUrl, { name });
  }

  deleteFiliere(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  createClass(filiereId: number, name: string): Observable<AcademicClass> {
    return this.http.post<AcademicClass>(`${this.baseUrl}/${filiereId}/classes`, { name });
  }

  deleteClass(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/classes/${id}`);
  }

  createStudent(
    classId: number,
    firstName: string,
    lastName: string,
    email: string,
    nationalId: string,
  ): Observable<AcademicStudent> {
    return this.http.post<AcademicStudent>(`${this.baseUrl}/classes/${classId}/students`, {
      firstName,
      lastName,
      email,
      nationalId,
    });
  }

  updateStudentAccount(id: number, email: string, nationalId: string): Observable<AcademicStudent> {
    return this.http.put<AcademicStudent>(`${this.baseUrl}/students/${id}/account`, {
      email,
      nationalId,
    });
  }

  deleteStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/students/${id}`);
  }
}

export { apiErrorMessage };
