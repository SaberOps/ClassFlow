package com.classflow.backendspringboot.teacher.attendance;

import com.classflow.backendspringboot.academic.enrollment.Enrollment;
import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.AttendanceStatus;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.attendance.AttendanceRecord;
import com.classflow.backendspringboot.student.attendance.AttendanceRecordRepository;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.student.timetable.TimetableSession;
import com.classflow.backendspringboot.student.timetable.TimetableSessionRepository;
import com.classflow.backendspringboot.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherAttendanceServiceTest {
    @Mock TimetableSessionRepository sessions;
    @Mock EnrollmentRepository enrollments;
    @Mock AttendanceRecordRepository attendance;
    private TeacherAttendanceService service;

    @BeforeEach
    void setUp() { service = new TeacherAttendanceService(sessions, enrollments, attendance); }

    @Test
    void correctionRetainsOriginalTimestampAndAddsModificationTimestamp() {
        User teacher = teacher(2L);
        User student = new User();
        student.setId(8L);
        student.setFirstName("Ada");
        student.setLastName("Lovelace");
        student.setEmail("ada@classflow.test");
        Course course = new Course();
        course.setId(4L);
        course.setTeacher(teacher);
        course.setTitle("Algorithms");
        TimetableSession session = new TimetableSession();
        ReflectionTestUtils.setField(session, "id", 12L);
        session.setCourse(course);
        session.setStartsAt(Instant.parse("2026-11-18T08:00:00Z"));
        session.setEndsAt(Instant.parse("2026-11-18T09:00:00Z"));
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        Instant recorded = Instant.parse("2026-11-18T08:01:00Z");
        AttendanceRecord existing = new AttendanceRecord();
        existing.setSession(session);
        existing.setStudent(student);
        existing.setStatus(AttendanceStatus.ABSENT);
        existing.setRecordedAt(recorded);
        when(sessions.findOwnedByTeacher(12L, 2L)).thenReturn(Optional.of(session));
        when(enrollments.findByCourseId(4L)).thenReturn(List.of(enrollment));
        when(attendance.findBySessionIdAndStudentId(12L, 8L)).thenReturn(Optional.of(existing));
        when(attendance.findBySessionId(12L)).thenReturn(List.of(existing));
        when(attendance.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.save(teacher, 12L, new TeacherAttendanceDtos.SaveAttendanceRequest(List.of(
                new TeacherAttendanceDtos.AttendanceEntry(8L, AttendanceStatus.PRESENT, "Correction"))));

        assertEquals(AttendanceStatus.PRESENT, existing.getStatus());
        assertEquals("Correction", existing.getRemark());
        assertEquals(recorded, existing.getRecordedAt());
        assertNotNull(existing.getUpdatedAt());
        verify(attendance).save(existing);
    }

    @Test
    void attendanceSessionMustBelongToSignedInTeacher() {
        when(sessions.findOwnedByTeacher(12L, 2L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.roster(teacher(2L), 12L));

        verifyNoInteractions(enrollments, attendance);
    }

    private static User teacher(long id) {
        User teacher = new User();
        teacher.setId(id);
        teacher.setRole(com.classflow.backendspringboot.user.Role.TEACHER);
        return teacher;
    }
}
