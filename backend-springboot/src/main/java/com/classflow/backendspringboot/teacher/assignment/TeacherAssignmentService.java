package com.classflow.backendspringboot.teacher.assignment;

import com.classflow.backendspringboot.common.AssignmentStatus;
import com.classflow.backendspringboot.common.FileStorageService;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.student.assignment.Assignment;
import com.classflow.backendspringboot.student.assignment.AssignmentAttachment;
import com.classflow.backendspringboot.student.assignment.AssignmentAttachmentRepository;
import com.classflow.backendspringboot.student.assignment.AssignmentRepository;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.student.course.CourseRepository;
import com.classflow.backendspringboot.student.submission.Submission;
import com.classflow.backendspringboot.student.submission.SubmissionRepository;
import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeacherAssignmentService {
    private final CourseRepository courses;
    private final AssignmentRepository assignments;
    private final AssignmentAttachmentRepository attachments;
    private final SubmissionRepository submissions;
    private final EnrollmentRepository enrollments;
    private final FileStorageService files;

    public TeacherAssignmentService(CourseRepository courses, AssignmentRepository assignments,
                                    AssignmentAttachmentRepository attachments, SubmissionRepository submissions,
                                    EnrollmentRepository enrollments, FileStorageService files) {
        this.courses = courses;
        this.assignments = assignments;
        this.attachments = attachments;
        this.submissions = submissions;
        this.enrollments = enrollments;
        this.files = files;
    }

    @Transactional(readOnly = true)
    public List<AssignmentItem> list(User teacher) {
        return assignments.findByCourseTeacherIdOrderByDueAtAsc(teacher.getId()).stream()
                .map(this::toItem)
                .toList();
    }

    @Transactional
    public AssignmentItem create(User teacher, AssignmentRequest request) {
        Assignment assignment = new Assignment();
        assignment.setCourse(requireCourse(teacher, request.courseId()));
        apply(assignment, request);
        assignments.save(assignment);
        saveAttachment(assignment, request.attachment());
        return toItem(assignment);
    }

    @Transactional
    public AssignmentItem update(User teacher, long assignmentId, AssignmentRequest request) {
        Assignment assignment = assignments.findByIdAndCourseTeacherId(assignmentId, teacher.getId())
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        if (!assignment.getCourse().getId().equals(request.courseId())) {
            assignment.setCourse(requireCourse(teacher, request.courseId()));
        }
        apply(assignment, request);
        assignments.save(assignment);
        attachments.deleteByAssignmentId(assignmentId);
        saveAttachment(assignment, request.attachment());
        return toItem(assignment);
    }

    @Transactional(readOnly = true)
    public AssignmentDetail detail(User teacher, long assignmentId) {
        Assignment assignment = assignments.findByIdAndCourseTeacherId(assignmentId, teacher.getId())
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        Map<Long, Submission> submitted = submissions.findByAssignmentId(assignmentId).stream()
                .collect(Collectors.toMap(s -> s.getStudent().getId(), s -> s, (a, b) -> a));
        List<StudentWork> work = enrollments.findByCourseId(assignment.getCourse().getId()).stream()
                .map(enrollment -> {
                    Submission submission = submitted.get(enrollment.getStudent().getId());
                    return submission == null ? missingWork(enrollment.getStudent()) : toWork(submission);
                })
                .sorted(Comparator.comparing(StudentWork::lastName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return new AssignmentDetail(toItem(assignment), work,
                (int) work.stream().filter(StudentWork::submitted).count(),
                work.size() - (int) work.stream().filter(StudentWork::submitted).count());
    }

    @Transactional
    public StudentWork grade(User teacher, long assignmentId, long submissionId, GradeRequest request) {
        Assignment assignment = assignments.findByIdAndCourseTeacherId(assignmentId, teacher.getId())
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        Submission submission = submissions.findById(submissionId)
                .filter(s -> s.getAssignment().getId().equals(assignment.getId()))
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        if (assignment.getMaxScore() == null || request.score().compareTo(BigDecimal.ZERO) < 0
                || request.score().compareTo(assignment.getMaxScore()) > 0) {
            throw new IllegalArgumentException("Score must be between 0 and the assignment maximum");
        }
        submission.setScore(request.score());
        submission.setTeacherFeedback(request.feedback());
        submission.setStatus(AssignmentStatus.GRADED);
        submission.setGradedAt(Instant.now());
        return toWork(submissions.save(submission));
    }

    private Course requireCourse(User teacher, long courseId) {
        return courses.findByIdAndTeacherIdAndActiveTrue(courseId, teacher.getId())
                .orElseThrow(() -> new NotFoundException("Course not found"));
    }

    private void apply(Assignment assignment, AssignmentRequest request) {
        if (!StringUtils.hasText(request.title()) || request.title().trim().length() > 200) {
            throw new IllegalArgumentException("Title is required and must be at most 200 characters");
        }
        if (request.dueAt() == null) throw new IllegalArgumentException("A due date is required");
        if (request.maxScore() == null || request.maxScore().compareTo(BigDecimal.ZERO) <= 0
                || request.maxScore().compareTo(new BigDecimal("9999.99")) > 0) {
            throw new IllegalArgumentException("Maximum score must be greater than zero");
        }
        assignment.setTitle(request.title().trim());
        assignment.setInstructions(request.instructions());
        assignment.setDueAt(request.dueAt());
        assignment.setMaxScore(request.maxScore());
        assignment.setAllowResubmit(true);
    }

    private void saveAttachment(Assignment assignment, AttachmentRequest request) {
        if (request == null) return;
        Long fileId = storedFileId(request.fileUrl());
        if (!StringUtils.hasText(request.fileName()) || fileId == null
                || !files.isOwnedBy(fileId, assignment.getCourse().getTeacher().getId())) {
            throw new IllegalArgumentException("Choose a file uploaded to your account");
        }
        AssignmentAttachment attachment = new AssignmentAttachment();
        attachment.setAssignment(assignment);
        attachment.setFileName(request.fileName().trim());
        attachment.setFileUrl(request.fileUrl().trim());
        attachment.setContentType(request.contentType());
        attachments.save(attachment);
    }

    private Long storedFileId(String value) {
        if (value == null || !value.matches("^/api/files/[1-9][0-9]*$")) return null;
        try {
            return Long.parseLong(value.substring("/api/files/".length()));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private AssignmentItem toItem(Assignment a) {
        return new AssignmentItem(a.getId(), a.getCourse().getId(), a.getCourse().getTitle(),
                a.getTitle(), a.getInstructions(), a.getDueAt(), a.getMaxScore(),
                attachments.findByAssignmentId(a.getId()).stream().findFirst()
                        .map(attachment -> new AttachmentItem(attachment.getFileName(), attachment.getFileUrl()))
                        .orElse(null));
    }

    private StudentWork toWork(Submission s) {
        return new StudentWork(s.getId(), s.getStudent().getId(), s.getStudent().getFirstName(),
                s.getStudent().getLastName(), s.getStudent().getEmail(), true, s.getSubmittedAt(),
                s.getFileName(), s.getFileUrl(), s.getComment(), s.getScore(),
                s.getTeacherFeedback(), s.getStatus(), s.getGradedAt());
    }

    private StudentWork missingWork(User student) {
        return new StudentWork(null, student.getId(), student.getFirstName(), student.getLastName(),
                student.getEmail(), false, null, null, null, null, null, null, null, null);
    }

    public record AssignmentRequest(long courseId, String title, String instructions, Instant dueAt,
                                    BigDecimal maxScore, AttachmentRequest attachment) {}
    public record AttachmentRequest(String fileName, String fileUrl, String contentType) {}
    public record GradeRequest(BigDecimal score, String feedback) {}
    public record AssignmentItem(Long id, Long courseId, String courseTitle, String title,
                                 String instructions, Instant dueAt, BigDecimal maxScore, AttachmentItem attachment) {}
    public record AttachmentItem(String fileName, String fileUrl) {}
    public record StudentWork(Long submissionId, Long studentId, String firstName, String lastName,
                              String email, boolean submitted, Instant submittedAt, String fileName,
                              String fileUrl, String comment, BigDecimal score, String feedback,
                              AssignmentStatus status, Instant gradedAt) {}
    public record AssignmentDetail(AssignmentItem assignment, List<StudentWork> submissions,
                                   int submittedCount, int missingCount) {}
}
