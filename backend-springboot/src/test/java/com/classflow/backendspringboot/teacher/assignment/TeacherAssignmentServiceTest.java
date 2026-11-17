package com.classflow.backendspringboot.teacher.assignment;

import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.academic.enrollment.Enrollment;
import com.classflow.backendspringboot.common.FileStorageService;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.assignment.Assignment;
import com.classflow.backendspringboot.student.assignment.AssignmentAttachmentRepository;
import com.classflow.backendspringboot.student.assignment.AssignmentRepository;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.student.course.CourseRepository;
import com.classflow.backendspringboot.student.submission.Submission;
import com.classflow.backendspringboot.student.submission.SubmissionRepository;
import com.classflow.backendspringboot.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherAssignmentServiceTest {
    @Mock CourseRepository courses;
    @Mock AssignmentRepository assignments;
    @Mock AssignmentAttachmentRepository attachments;
    @Mock SubmissionRepository submissions;
    @Mock EnrollmentRepository enrollments;
    @Mock FileStorageService files;

    private TeacherAssignmentService service;

    @BeforeEach
    void setUp() {
        service = new TeacherAssignmentService(courses, assignments, attachments, submissions, enrollments, files);
    }

    @Test
    void gradingCannotExceedTheConfiguredMaximum() {
        User teacher = teacher(7L);
        Assignment assignment = assignment(41L, teacher, new BigDecimal("10"));
        Submission submission = new Submission();
        submission.setAssignment(assignment);
        when(assignments.findByIdAndCourseTeacherId(41L, 7L)).thenReturn(Optional.of(assignment));
        when(submissions.findById(9L)).thenReturn(Optional.of(submission));

        assertThrows(IllegalArgumentException.class, () -> service.grade(
                teacher, 41L, 9L, new TeacherAssignmentService.GradeRequest(new BigDecimal("10.01"), null)));

        verify(submissions, never()).save(any());
    }

    @Test
    void teacherCannotReadAnotherTeachersAssignment() {
        User teacher = teacher(7L);
        when(assignments.findByIdAndCourseTeacherId(41L, 7L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.detail(teacher, 41L));

        verify(submissions, never()).findByAssignmentId(anyLong());
    }

    @Test
    void assignmentRosterIncludesStudentsWhoHaveNotSubmitted() {
        User teacher = teacher(7L);
        User student = new User();
        student.setId(8L);
        student.setFirstName("Ada");
        student.setLastName("Lovelace");
        student.setEmail("ada@classflow.test");
        Assignment assignment = assignment(41L, teacher, new BigDecimal("10"));
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        when(assignments.findByIdAndCourseTeacherId(41L, 7L)).thenReturn(Optional.of(assignment));
        when(submissions.findByAssignmentId(41L)).thenReturn(List.of());
        when(enrollments.findByCourseId(5L)).thenReturn(List.of(enrollment));

        var result = service.detail(teacher, 41L);

        assertEquals(0, result.submittedCount());
        assertEquals(1, result.missingCount());
        assertFalse(result.submissions().getFirst().submitted());
    }

    private static User teacher(long id) {
        User teacher = new User();
        teacher.setId(id);
        teacher.setRole(com.classflow.backendspringboot.user.Role.TEACHER);
        return teacher;
    }

    private static Assignment assignment(long id, User teacher, BigDecimal maximum) {
        Course course = new Course();
        course.setId(5L);
        course.setTeacher(teacher);
        Assignment assignment = new Assignment();
        assignment.setId(id);
        assignment.setCourse(course);
        assignment.setMaxScore(maximum);
        return assignment;
    }
}
