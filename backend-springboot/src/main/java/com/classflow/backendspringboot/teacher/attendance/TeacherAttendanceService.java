package com.classflow.backendspringboot.teacher.attendance;

import com.classflow.backendspringboot.academic.enrollment.Enrollment;
import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.attendance.AttendanceRecord;
import com.classflow.backendspringboot.student.attendance.AttendanceRecordRepository;
import com.classflow.backendspringboot.student.timetable.TimetableSession;
import com.classflow.backendspringboot.student.timetable.TimetableSessionRepository;
import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TeacherAttendanceService {

    private final TimetableSessionRepository sessions;
    private final EnrollmentRepository enrollments;
    private final AttendanceRecordRepository attendance;

    public TeacherAttendanceService(
            TimetableSessionRepository sessions,
            EnrollmentRepository enrollments,
            AttendanceRecordRepository attendance) {
        this.sessions = sessions;
        this.enrollments = enrollments;
        this.attendance = attendance;
    }

    @Transactional(readOnly = true)
    public TeacherAttendanceDtos.SessionRoster roster(User teacher, Long sessionId) {
        TimetableSession session = sessions.findOwnedByTeacher(sessionId, teacher.getId())
                .orElseThrow(() -> new NotFoundException("Session not found"));
        return toRoster(session);
    }

    @Transactional
    public TeacherAttendanceDtos.SessionRoster save(
            User teacher, Long sessionId, TeacherAttendanceDtos.SaveAttendanceRequest request) {

        TimetableSession session = sessions.findOwnedByTeacher(sessionId, teacher.getId())
                .orElseThrow(() -> new NotFoundException("Session not found"));

        Map<Long, Enrollment> enrolled = enrollments.findByCourseId(session.getCourse().getId()).stream()
                .collect(Collectors.toMap(e -> e.getStudent().getId(), Function.identity(), (a, b) -> a));

        Instant now = Instant.now();
        for (TeacherAttendanceDtos.AttendanceEntry entry : request.entries()) {
            if (!enrolled.containsKey(entry.studentId())) {
                throw new NotFoundException("Student " + entry.studentId() + " is not enrolled");
            }
            AttendanceRecord record = attendance
                    .findBySessionIdAndStudentId(sessionId, entry.studentId())
                    .orElse(null);
            if (record == null) {
                record = new AttendanceRecord();
                record.setSession(session);
                record.setStudent(enrolled.get(entry.studentId()).getStudent());
                record.setRecordedAt(now);
            } else {
                record.setUpdatedAt(now);
            }
            record.setStatus(entry.status());
            record.setRemark(entry.remark());
            attendance.save(record);
        }
        return toRoster(session);
    }

    private TeacherAttendanceDtos.SessionRoster toRoster(TimetableSession session) {
        Map<Long, AttendanceRecord> existing = attendance.findBySessionId(session.getId()).stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), Function.identity(), (a, b) -> a));

        List<TeacherAttendanceDtos.RosterEntry> rows = new ArrayList<>();
        for (Enrollment e : enrollments.findByCourseId(session.getCourse().getId())) {
            User s = e.getStudent();
            AttendanceRecord r = existing.get(s.getId());
            rows.add(new TeacherAttendanceDtos.RosterEntry(
                    s.getId(),
                    s.getFirstName(),
                    s.getLastName(),
                    s.getEmail(),
                    r != null ? r.getStatus() : null,
                    r != null ? r.getRemark() : null,
                    r != null ? r.getRecordedAt() : null,
                    r != null ? r.getUpdatedAt() : null));
        }
        return new TeacherAttendanceDtos.SessionRoster(
                session.getId(),
                session.getCourse().getId(),
                session.getCourse().getTitle(),
                session.getStartsAt(),
                session.getEndsAt(),
                session.getRoom(),
                rows);
    }
}