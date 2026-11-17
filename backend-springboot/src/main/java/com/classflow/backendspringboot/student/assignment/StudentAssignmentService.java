package com.classflow.backendspringboot.student.assignment;

import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.AssignmentStatus;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.submission.Submission;
import com.classflow.backendspringboot.student.submission.SubmissionRepository;
import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StudentAssignmentService {

    private final AssignmentRepository assignments;
    private final AssignmentAttachmentRepository attachments;
    private final SubmissionRepository submissions;
    private final EnrollmentRepository enrollments;

    public StudentAssignmentService(
            AssignmentRepository assignments,
            AssignmentAttachmentRepository attachments,
            SubmissionRepository submissions,
            EnrollmentRepository enrollments) {
        this.assignments = assignments;
        this.attachments = attachments;
        this.submissions = submissions;
        this.enrollments = enrollments;
    }

    public static AssignmentStatus resolveStatus(Assignment a, Submission sub, Instant now) {
        if (sub == null) {
            return a.getDueAt().isBefore(now) ? AssignmentStatus.LATE : AssignmentStatus.TODO;
        }
        if (sub.getStatus() == AssignmentStatus.GRADED || sub.getStatus() == AssignmentStatus.IN_REVIEW) {
            return sub.getStatus();
        }
        return AssignmentStatus.SUBMITTED;
    }

    /** US27 */
    @Transactional(readOnly = true)
    public List<AssignmentDtos.AssignmentListItem> list(
            User student, Long courseId, AssignmentStatus statusFilter) {
        Instant now = Instant.now();
        Map<Long, Submission> subs = submissions.findByStudentId(student.getId()).stream()
                .collect(Collectors.toMap(
                        s -> s.getAssignment().getId(),
                        Function.identity(),
                        (a, b) -> a));

        return assignments.findAllForStudent(student.getId()).stream()
                .filter(a -> courseId == null || a.getCourse().getId().equals(courseId))
                .map(a -> {
                    Submission sub = subs.get(a.getId());
                    AssignmentStatus st = resolveStatus(a, sub, now);
                    return new AssignmentDtos.AssignmentListItem(
                            a.getId(),
                            a.getTitle(),
                            a.getCourse().getTitle(),
                            a.getCourse().getId(),
                            a.getDueAt(),
                            st,
                            sub != null ? sub.getSubmittedAt() : null,
                            sub != null ? sub.getScore() : null);
                })
                .filter(item -> statusFilter == null || item.status() == statusFilter)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssignmentDtos.AssignmentDetail detail(User student, Long assignmentId) {
        Assignment a = assignments.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        if (!enrollments.existsByCourseIdAndStudentId(a.getCourse().getId(), student.getId())) {
            throw new NotFoundException("Assignment not found");
        }

        var atts = attachments.findByAssignmentId(assignmentId).stream()
                .map(x -> new AssignmentDtos.AttachmentDto(
                        x.getId(), x.getFileName(), x.getFileUrl(), x.getContentType()))
                .toList();

        Submission sub = submissions
                .findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElse(null);

        AssignmentDtos.SubmissionView sv = null;
        if (sub != null) {
            sv = new AssignmentDtos.SubmissionView(
                    sub.getId(),
                    sub.getSubmittedAt(),
                    sub.getFileName(),
                    sub.getFileUrl(),
                    sub.getComment(),
                    sub.getStatus(),
                    sub.getScore(),
                    sub.getTeacherFeedback(),
                    sub.getGradedAt());
        }

        return new AssignmentDtos.AssignmentDetail(
                a.getId(),
                a.getTitle(),
                a.getInstructions(),
                a.getDueAt(),
                a.isAllowResubmit(),
                a.getMaxScore(),
                a.getCourse().getTitle(),
                a.getCourse().getId(),
                atts,
                sv);
    }

    /** US30 — uniquement ses notes, classées par matière (courseTitle) */
    @Transactional(readOnly = true)
    public List<AssignmentDtos.GradeItem> myGrades(User student) {
        return submissions.findByStudentId(student.getId()).stream()
                .filter(s -> s.getStatus() == AssignmentStatus.GRADED)
                .map(s -> new AssignmentDtos.GradeItem(
                        s.getAssignment().getId(),
                        s.getAssignment().getTitle(),
                        s.getAssignment().getCourse().getTitle(),
                        s.getScore(),
                        s.getTeacherFeedback(),
                        s.getGradedAt()))
                .toList();
    }
}