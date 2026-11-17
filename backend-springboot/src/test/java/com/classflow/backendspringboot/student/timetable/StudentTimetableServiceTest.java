package com.classflow.backendspringboot.student.timetable;

import com.classflow.backendspringboot.academic.AcademicClass;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentTimetableServiceTest {
    @Mock TimetableSessionRepository sessions;

    @Test
    void studentSeesClassSessionsAndDuplicateEnrollmentResultsOnlyOnce() {
        User student = new User();
        student.setId(5L);
        User teacher = new User();
        teacher.setId(7L);
        teacher.setFirstName("Ada");
        teacher.setLastName("Lovelace");
        Course course = new Course();
        course.setId(3L);
        course.setTitle("Algorithms");
        course.setTeacher(teacher);
        AcademicClass academicClass = new AcademicClass(null, "Class A");
        ReflectionTestUtils.setField(academicClass, "id", 2L);
        TimetableSession session = new TimetableSession();
        ReflectionTestUtils.setField(session, "id", 10L);
        session.setCourse(course);
        session.setAcademicClass(academicClass);
        session.setTeacher(teacher);
        session.setStartsAt(Instant.parse("2026-11-16T10:00:00Z"));
        session.setEndsAt(Instant.parse("2026-11-16T11:00:00Z"));

        when(sessions.findForStudentClassBetween(5L,
                Instant.parse("2026-11-16T00:00:00Z"),
                Instant.parse("2026-11-23T00:00:00Z"))).thenReturn(List.of(session));

        StudentTimetableService service = new StudentTimetableService(sessions);
        TimetableDtos.WeekResponse response = service.week(student, LocalDate.of(2026, 11, 16));

        assertEquals(1, response.sessions().size());
        assertEquals("Class A", response.sessions().getFirst().className());
        assertEquals("Ada Lovelace", response.sessions().getFirst().teacherName());
        verify(sessions).findForStudentClassBetween(5L,
                Instant.parse("2026-11-16T00:00:00Z"),
                Instant.parse("2026-11-23T00:00:00Z"));
        verifyNoMoreInteractions(sessions);
    }
}
