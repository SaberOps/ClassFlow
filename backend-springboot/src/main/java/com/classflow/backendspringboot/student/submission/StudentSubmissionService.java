package com.classflow.backendspringboot.student.submission;

import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.AssignmentStatus;
import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.assignment.Assignment;
import com.classflow.backendspringboot.student.assignment.AssignmentRepository;
import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class StudentSubmissionService {

    private final AssignmentRepository assignments;
    private final SubmissionRepository submissions;
    private final EnrollmentRepository enrollments;

    public StudentSubmissionService(
            AssignmentRepository assignments,
            SubmissionRepository submissions,
            EnrollmentRepository enrollments) {
        this.assignments = assignments;
        this.submissions = submissions;
        this.enrollments = enrollments;
    }

    /**
     * US28 — dépôt / remplacement avant échéance.
     * Règle choisie : dépôt après échéance = refus (ConflictException).
     */
    @Transactional
    public SubmissionDtos.SubmissionDto submit(
            User student, Long assignmentId, SubmissionDtos.SubmitRequest request) {

        Assignment a = assignments.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));

        if (!enrollments.existsByCourseIdAndStudentId(a.getCourse().getId(), student.getId())) {
            throw new NotFoundException("Assignment not found");
        }

        Instant now = Instant.now();
        Submission existing = submissions
                .findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElse(null);

        if (existing != null) {
            if (!a.isAllowResubmit()) {
                throw new ConflictException("Resubmission is not allowed for this assignment");
            }
            if (a.getDueAt().isBefore(now)) {
                throw new ConflictException("Cannot replace submission after the deadline");
            }
            if (existing.getStatus() == AssignmentStatus.GRADED
                    || existing.getStatus() == AssignmentStatus.IN_REVIEW) {
                throw new ConflictException("Submission is already under review or graded");
            }
            existing.setFileName(request.fileName());
            existing.setFileUrl(request.fileUrl());
            existing.setComment(request.comment());
            existing.setSubmittedAt(now);
            existing.setStatus(AssignmentStatus.SUBMITTED);
            submissions.save(existing);
            return toDto(existing);
        }

        if (a.getDueAt().isBefore(now)) {
            throw new ConflictException("Deadline passed; submission refused");
        }

        Submission sub = new Submission();
        sub.setAssignment(a);
        sub.setStudent(student);
        sub.setSubmittedAt(now);
        sub.setFileName(request.fileName());
        sub.setFileUrl(request.fileUrl());
        sub.setComment(request.comment());
        sub.setStatus(AssignmentStatus.SUBMITTED);
        submissions.save(sub);
        return toDto(sub);
    }

    private static SubmissionDtos.SubmissionDto toDto(Submission s) {
        return new SubmissionDtos.SubmissionDto(
                s.getId(),
                s.getSubmittedAt(),
                s.getFileName(),
                s.getFileUrl(),
                s.getComment(),
                s.getStatus(),
                s.getScore(),
                s.getTeacherFeedback(),
                s.getGradedAt());
    }
}