import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface TimetableClassOption {
  id: number;
  name: string;
}

export interface TimetableCourseOption {
  id: number;
  code: string;
  title: string;
  teacherId: number;
  teacherName: string;
}

export interface TimetableTeacherOption {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AdminTimetableOptions {
  classes: TimetableClassOption[];
  courses: TimetableCourseOption[];
  teachers: TimetableTeacherOption[];
}

export interface AdminTimetableSession {
  id: number;
  courseId: number;
  courseTitle: string;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  startsAt: string;
  endsAt: string;
  room: string | null;
  cancelled: boolean;
}

export interface TimetableSessionPayload {
  courseId: number;
  classId: number;
  teacherId: number;
  startsAt: string;
  endsAt: string;
  room: string;
}

@Injectable({ providedIn: 'root' })
export class AdminTimetableService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/admin/timetable';

  options() {
    return this.http.get<AdminTimetableOptions>(`${this.baseUrl}/options`);
  }

  week(start: string) {
    return this.http.get<{ sessions: AdminTimetableSession[] }>(`${this.baseUrl}/week`, {
      params: new HttpParams().set('start', start)
    });
  }

  create(payload: TimetableSessionPayload) {
    return this.http.post<AdminTimetableSession>(this.baseUrl, payload);
  }

  update(id: number, payload: TimetableSessionPayload) {
    return this.http.put<AdminTimetableSession>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
