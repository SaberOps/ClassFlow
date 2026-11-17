export type AssignmentStatus = 'TODO' | 'SUBMITTED' | 'LATE' | 'IN_REVIEW' | 'GRADED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface CourseSummary {
  id: number; code: string; title: string; teacherName: string; teacherEmail: string;
}
export interface CourseDetail {
  id: number; code: string; title: string; description?: string; objectives?: string;
  teacher: { id: number; firstName: string; lastName: string; email: string };
  resources: { id: number; title: string; fileName: string; fileUrl: string }[];
  assignments: { id: number; title: string; dueAt: string }[];
}
export interface AssignmentListItem {
  id: number; title: string; courseTitle: string; courseId: number;
  dueAt: string; status: AssignmentStatus; submittedAt?: string; score?: number;
}
export interface AssignmentDetail {
  id: number; title: string; instructions?: string; dueAt: string; allowResubmit: boolean;
  maxScore?: number; courseTitle: string; courseId: number;
  attachments: { id: number; fileName: string; fileUrl: string }[];
  submission?: {
    id: number; submittedAt: string; fileName?: string; fileUrl?: string; comment?: string;
    status: AssignmentStatus; score?: number; teacherFeedback?: string;
  } | null;
}
export interface GradeItem {
  assignmentId: number; title: string; courseTitle: string; score?: number; teacherFeedback?: string; gradedAt?: string;
}
export interface SessionItem {
  id: number; courseId: number; courseTitle: string; teacherName: string;
  startsAt: string; endsAt: string; room?: string; meetingUrl?: string;
  cancelled: boolean; lastMinuteChange: boolean; changeNote?: string;
}
export interface AttendanceOverview {
  history: { id: number; courseId: number; courseTitle: string; sessionStartsAt: string; status: AttendanceStatus; remark?: string }[];
  byCourse: { courseId: number; courseTitle: string; present: number; absent: number; late: number; presenceRate: number }[];
}
export interface NotificationItem {
  id: number; type: string; title: string; body?: string; link?: string; read: boolean; createdAt: string;
}
export interface RequestDocument {
  id: number; title: string; description?: string; fileName: string; fileUrl: string; publishedAt: string;
}
export interface CourseResource {
  id: number; courseId: number; courseTitle: string; courseCode: string;
  title: string; resourceType: string; contentBody?: string; fileName: string; fileUrl: string; publishedAt: string;
}
export interface Profile {
  id: number; firstName: string; lastName: string; email: string; studentNumber?: string;
  departmentName?: string; className?: string; phone?: string; photoUrl?: string; courseTitles: string[];
}
export interface TeacherContact {
  id: number; firstName: string; lastName: string; email: string; courses: string[];
}

export interface StudentMessage {
  id: number; courseId: number; senderId: number; senderName: string;
  body: string; sentAt: string; readAt?: string | null;
}
export interface StudentFeedItem {
  type: 'ANNOUNCEMENT' | 'SESSION' | 'ASSIGNMENT'; id: number;
  title: string; description?: string; courseTitle?: string; date: string; link: string;
}
export interface AbsenceJustification {
  id: number; attendanceRecordId: number; fileName: string; fileUrl: string;
  comment?: string; status: string; submittedAt: string; attendanceStatus: string;
  absenceAt?: string; courseTitle?: string;
}
