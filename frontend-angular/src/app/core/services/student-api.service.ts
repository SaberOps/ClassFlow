import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AssignmentDetail, AssignmentListItem, AttendanceOverview, CourseDetail, CourseSummary,
  GradeItem, NotificationItem, Profile, RequestDocument, SessionItem, TeacherContact, StudentMessage, StudentFeedItem, AbsenceJustification
} from '../../shared/models/student.model';

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/student';

  courses(q?: string) {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<CourseSummary[]>(`${this.base}/courses`, { params });
  }
  course(id: number) { return this.http.get<CourseDetail>(`${this.base}/courses/${id}`); }
  assignments(courseId?: number, status?: string) {
    let params = new HttpParams();
    if (courseId != null) params = params.set('courseId', String(courseId));
    if (status) params = params.set('status', status);
    return this.http.get<AssignmentListItem[]>(`${this.base}/assignments`, { params });
  }
  assignment(id: number) { return this.http.get<AssignmentDetail>(`${this.base}/assignments/${id}`); }
  submit(id: number, body: { fileName: string; fileUrl: string; comment?: string }) {
    return this.http.post(`${this.base}/assignments/${id}/submissions`, body);
  }
  grades() { return this.http.get<GradeItem[]>(`${this.base}/assignments/grades`); }
  attendance() { return this.http.get<AttendanceOverview>(`${this.base}/attendance`); }
  timetableWeek(start: string) {
    return this.http.get<{ sessions: SessionItem[] }>(`${this.base}/timetable/week`, { params: { start } });
  }
  notifications() { return this.http.get<NotificationItem[]>(`${this.base}/notifications`); }
  unreadCount() { return this.http.get<{ unread: number }>(`${this.base}/notifications/unread-count`); }
  markRead(id: number) { return this.http.post<void>(`${this.base}/notifications/${id}/read`, {}); }
  markAllRead() { return this.http.post<void>(`${this.base}/notifications/read-all`, {}); }
  requestDocuments() { return this.http.get<RequestDocument[]>(`${this.base}/request-documents`); }
  profile() { return this.http.get<Profile>(`${this.base}/profile`); }
  updateProfile(body: { phone?: string; photoUrl?: string }) { return this.http.put<Profile>(`${this.base}/profile`, body); }
  changePassword(body: { currentPassword: string; newPassword: string }) {
    return this.http.post<void>(`${this.base}/profile/password`, body);
  }
  teachers() { return this.http.get<TeacherContact[]>(`${this.base}/teachers`); }
  feed() { return this.http.get<StudentFeedItem[]>(`${this.base}/feed`); }
  messages(courseId: number) { return this.http.get<StudentMessage[]>(`${this.base}/messages`, { params: { courseId } }); }
  sendMessage(body: { courseId: number; body: string }) { return this.http.post<StudentMessage>(`${this.base}/messages`, body); }
  justifications() { return this.http.get<AbsenceJustification[]>(`${this.base}/attendance/justifications`); }
  submitJustification(body: { attendanceRecordId: number; fileName: string; fileUrl: string; comment?: string }) {
    return this.http.post<AbsenceJustification>(`${this.base}/attendance/justifications`, body);
  }
}
