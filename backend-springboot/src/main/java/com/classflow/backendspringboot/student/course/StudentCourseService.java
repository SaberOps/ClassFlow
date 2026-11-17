package com.classflow.backendspringboot.student.course;

import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.assignment.AssignmentRepository;
import com.classflow.backendspringboot.student.resource.ResourceRepository;
import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class StudentCourseService {

    private final EnrollmentRepository enrollments;
    private final CourseRepository courses;
    private final ResourceRepository resources;
    private final AssignmentRepository assignments;

    public StudentCourseService(
            EnrollmentRepository enrollments,
            CourseRepository courses,
            ResourceRepository resources,
            AssignmentRepository assignments) {
        this.enrollments = enrollments;
        this.courses = courses;
        this.resources = resources;
        this.assignments = assignments;
    }

    @Transactional(readOnly = true)
    public List<CourseDtos.CourseSummary> list(User student, String q) {
        return enrollments.findActiveCoursesByStudentId(student.getId()).stream()
                .filter(c -> q == null || q.isBlank()
                        || c.getTitle().toLowerCase(Locale.ROOT).contains(q.toLowerCase(Locale.ROOT))
                        || c.getCode().toLowerCase(Locale.ROOT).contains(q.toLowerCase(Locale.ROOT)))
                .map(c -> new CourseDtos.CourseSummary(
                        c.getId(),
                        c.getCode(),
                        c.getTitle(),
                        c.getTeacher().getFirstName() + " " + c.getTeacher().getLastName(),
                        c.getTeacher().getEmail()))
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseDtos.CourseDetail detail(User student, Long courseId) {
        if (!enrollments.existsByCourseIdAndStudentId(courseId, student.getId())) {
            throw new NotFoundException("Course not found");
        }
        Course c = courses.findByIdAndActiveTrue(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        var teacher = c.getTeacher();
        var resourceBriefs = resources.findByCourseIdOrderByPublishedAtDesc(courseId).stream()
                .map(r -> new CourseDtos.ResourceBrief(
                        r.getId(), r.getTitle(), r.getFileName(), r.getFileUrl(), r.getPublishedAt()))
                .toList();
        var assignmentBriefs = assignments.findByCourseIdOrderByDueAtAsc(courseId).stream()
                .map(a -> new CourseDtos.AssignmentBrief(a.getId(), a.getTitle(), a.getDueAt()))
                .toList();

        return new CourseDtos.CourseDetail(
                c.getId(),
                c.getCode(),
                c.getTitle(),
                c.getDescription(),
                c.getObjectives(),
                new CourseDtos.TeacherInfo(
                        teacher.getId(), teacher.getFirstName(), teacher.getLastName(), teacher.getEmail()),
                resourceBriefs,
                assignmentBriefs);
    }
}