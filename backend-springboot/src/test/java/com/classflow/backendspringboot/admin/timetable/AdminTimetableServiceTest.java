package com.classflow.backendspringboot.admin.timetable;

import com.classflow.backendspringboot.academic.AcademicClass;
import com.classflow.backendspringboot.academic.AcademicClassRepository;
import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.student.course.CourseRepository;
import com.classflow.backendspringboot.student.timetable.TimetableSession;
import com.classflow.backendspringboot.student.timetable.TimetableSessionRepository;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.AdminUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminTimetableServiceTest {
    @Mock TimetableSessionRepository sessions;
    @Mock AcademicClassRepository classes;
    @Mock CourseRepository courses;
    @Mock AdminUserRepository users;
    private AdminTimetableService service;

    @BeforeEach
    void setUp() {
        service = new AdminTimetableService(sessions, classes, courses, users);
    }

    @Test
    void overlappingClassSessionIsRejected() {
        User teacher = teacher(3L);
        Course course = course(1L, teacher);
        AcademicClass academicClass = academicClass(2L, "Class A");
        prepareValidOptions(course, academicClass, teacher);

        TimetableSession overlap = new TimetableSession();
        overlap.setCourse(course);
        overlap.setAcademicClass(academicClass);
        overlap.setTeacher(teacher(7L));
        when(sessions.findOverlapping(eq(2L), eq(3L), eq("B12"), any(), any(), isNull()))
                .thenReturn(List.of(overlap));

        ConflictException error = assertThrows(ConflictException.class,
                () -> service.create(request("B12")));

        assertTrue(error.getMessage().contains("class"));
        verify(sessions, never()).save(any());
    }

    @Test
    void overlappingTeacherSessionIsRejectedAcrossClasses() {
        User teacher = teacher(3L);
        Course course = course(1L, teacher);
        AcademicClass academicClass = academicClass(2L, "Class A");
        prepareValidOptions(course, academicClass, teacher);

        TimetableSession overlap = new TimetableSession();
        overlap.setCourse(course);
        overlap.setAcademicClass(academicClass(9L, "Class B"));
        overlap.setTeacher(teacher);
        when(sessions.findOverlapping(eq(2L), eq(3L), eq("B12"), any(), any(), isNull()))
                .thenReturn(List.of(overlap));

        ConflictException error = assertThrows(ConflictException.class,
                () -> service.create(request("B12")));

        assertEquals("Schedule conflict: teacher", error.getMessage());
    }

    @Test
    void roomConflictIgnoresCase() {
        User teacher = teacher(3L);
        Course course = course(1L, teacher);
        AcademicClass academicClass = academicClass(2L, "Class A");
        prepareValidOptions(course, academicClass, teacher);

        TimetableSession overlap = new TimetableSession();
        overlap.setCourse(course);
        overlap.setAcademicClass(academicClass(9L, "Class B"));
        overlap.setTeacher(teacher(7L));
        overlap.setRoom("b12");
        when(sessions.findOverlapping(eq(2L), eq(3L), eq("B12"), any(), any(), isNull()))
                .thenReturn(List.of(overlap));

        ConflictException error = assertThrows(ConflictException.class,
                () -> service.create(request("B12")));

        assertEquals("Schedule conflict: room", error.getMessage());
    }

    @Test
    void endTimeMustBeLaterThanStartTime() {
        AdminTimetableDtos.SessionRequest request = new AdminTimetableDtos.SessionRequest(
                1L, 2L, 3L,
                Instant.parse("2026-11-18T10:00:00Z"),
                Instant.parse("2026-11-18T10:00:00Z"),
                "B12");

        ConflictException error = assertThrows(ConflictException.class, () -> service.create(request));

        assertEquals("The session end time must be after its start time", error.getMessage());
        verifyNoInteractions(courses, classes, users, sessions);
    }

    @Test
    void adminCanAssignAnActiveTeacherToACourseSession() {
        User courseTeacher = teacher(8L);
        User scheduledTeacher = teacher(3L);
        Course course = course(1L, courseTeacher);
        AcademicClass academicClass = academicClass(2L, "Class A");
        prepareValidOptions(course, academicClass, scheduledTeacher);
        when(sessions.findOverlapping(eq(2L), eq(3L), eq("B12"), any(), any(), isNull()))
                .thenReturn(List.of());
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AdminTimetableDtos.SessionItem created = service.create(request("B12"));

        assertEquals(3L, created.teacherId());
    }

    private void prepareValidOptions(Course course, AcademicClass academicClass, User teacher) {
        when(courses.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(classes.findById(2L)).thenReturn(Optional.of(academicClass));
        when(users.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(teacher));
    }

    private static AdminTimetableDtos.SessionRequest request(String room) {
        return new AdminTimetableDtos.SessionRequest(
                1L, 2L, 3L,
                Instant.parse("2026-11-18T10:00:00Z"),
                Instant.parse("2026-11-18T11:00:00Z"),
                room);
    }

    private static User teacher(long id) {
        User teacher = new User();
        teacher.setId(id);
        teacher.setRole(Role.TEACHER);
        teacher.setEnabled(true);
        teacher.setFirstName("Ada");
        teacher.setLastName("Lovelace");
        return teacher;
    }

    private static Course course(long id, User teacher) {
        Course course = new Course();
        ReflectionTestUtils.setField(course, "id", id);
        course.setTeacher(teacher);
        course.setTitle("Algorithms");
        return course;
    }

    private static AcademicClass academicClass(long id, String name) {
        AcademicClass academicClass = new AcademicClass(null, name);
        ReflectionTestUtils.setField(academicClass, "id", id);
        return academicClass;
    }
}
