import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export type TeacherResourceType = 'TEXT' | 'LINK' | 'FILE';
export interface TeacherCourse {
  id: number; code: string; title: string; description?: string; className?: string;
}
export interface TeacherResource {
  id: number; courseId: number; title: string; resourceType: TeacherResourceType;
  contentBody?: string; fileName: string; fileUrl: string; publishedAt: string; updatedAt?: string;
}
export interface TeacherAssignment {
  id: number; courseId: number; courseTitle: string; title: string; instructions?: string;
  dueAt: string; maxScore: number; attachment?: { fileName: string; fileUrl: string } | null;
}
export interface TeacherWork {
  submissionId?: number; studentId: number; firstName: string; lastName: string; email: string;
  submitted: boolean; submittedAt?: string; fileName?: string; fileUrl?: string; comment?: string;
  score?: number; feedback?: string; status?: string; gradedAt?: string;
}
export interface TeacherAssignmentDetail {
  assignment: TeacherAssignment; submissions: TeacherWork[]; submittedCount: number; missingCount: number;
}
export interface TeacherSession {
  id: number; courseId: number; courseTitle: string; teacherName: string; startsAt: string;
  endsAt: string; room?: string; meetingUrl?: string; cancelled: boolean; lastMinuteChange: boolean;
  changeNote?: string;
}
export interface TeacherRosterEntry {
  studentId: number; firstName: string; lastName: string; email: string;
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | null; remark?: string;
  recordedAt?: string; updatedAt?: string;
}
export interface TeacherRoster {
  sessionId: number; courseId: number; courseTitle: string; startsAt: string; endsAt: string;
  room?: string; students: TeacherRosterEntry[];
}
export interface TeacherProfile {
  id: number; firstName: string; lastName: string; email: string;
  phone?: string; photoUrl?: string; subjects: string[];
}
export interface TeacherNotification {
  id: number; type: string; title: string; body?: string; link?: string;
  read: boolean; createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/teacher';

  courses() { return this.http.get<TeacherCourse[]>(`${this.base}/courses`); }
  uploadFile(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ id: number; fileName: string; contentType?: string; url: string }>('/api/files', form);
  }
  resources(courseId: number) {
    return this.http.get<TeacherResource[]>(`${this.base}/courses/${courseId}/content`);
  }
  createResource(courseId: number, body: Partial<TeacherResource>) {
    return this.http.post<TeacherResource>(`${this.base}/courses/${courseId}/content`, body);
  }
  updateResource(id: number, body: Partial<TeacherResource>) {
    return this.http.put<TeacherResource>(`${this.base}/content/${id}`, body);
  }
  deleteResource(id: number) { return this.http.delete<void>(`${this.base}/content/${id}`); }

  assignments() { return this.http.get<TeacherAssignment[]>(`${this.base}/assignments`); }
  createAssignment(body: object) {
    return this.http.post<TeacherAssignment>(`${this.base}/assignments`, body);
  }
  updateAssignment(id: number, body: object) {
    return this.http.put<TeacherAssignment>(`${this.base}/assignments/${id}`, body);
  }
  assignment(id: number) {
    return this.http.get<TeacherAssignmentDetail>(`${this.base}/assignments/${id}`);
  }
  grade(assignmentId: number, submissionId: number, score: number, feedback: string) {
    return this.http.put<TeacherWork>(
      `${this.base}/assignments/${assignmentId}/submissions/${submissionId}/grade`, { score, feedback });
  }

  timetableWeek(start: string) {
    return this.http.get<{ sessions: TeacherSession[] }>(`${this.base}/timetable/week`, {
      params: new HttpParams().set('start', start)
    });
  }
  roster(sessionId: number) {
    return this.http.get<TeacherRoster>(`${this.base}/sessions/${sessionId}/attendance`);
  }
  saveAttendance(sessionId: number, entries: { studentId: number; status: 'PRESENT' | 'ABSENT' | 'LATE' }[]) {
    return this.http.put<TeacherRoster>(`${this.base}/sessions/${sessionId}/attendance`, { entries });
  }

  profile() { return this.http.get<TeacherProfile>(`${this.base}/profile`); }
  updateProfile(body: { phone: string; photoUrl: string }) {
    return this.http.put<TeacherProfile>(`${this.base}/profile`, body);
  }
  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<void>(`${this.base}/profile/password`, { currentPassword, newPassword });
  }
  notifications() { return this.http.get<TeacherNotification[]>(`${this.base}/notifications`); }
  unreadCount() { return this.http.get<{ unread: number }>(`${this.base}/notifications/unread-count`); }
  markRead(id: number) { return this.http.post<void>(`${this.base}/notifications/${id}/read`, {}); }
  markAllRead() { return this.http.post<void>(`${this.base}/notifications/read-all`, {}); }
}
