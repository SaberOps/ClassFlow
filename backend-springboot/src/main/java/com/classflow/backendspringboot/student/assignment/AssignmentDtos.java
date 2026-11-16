package com.classflow.backendspringboot.student.assignment;

import com.classflow.backendspringboot.common.AssignmentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class AssignmentDtos {

    private AssignmentDtos() {}

    /** US27 — liste triée par échéance */
    public record AssignmentListItem(
            Long id,
            String title,
            String courseTitle,
            Long courseId,
            Instant dueAt,
            AssignmentStatus status,
            Instant submittedAt,
            BigDecimal score
    ) {}

    public record AttachmentDto(
            Long id,
            String fileName,
            String fileUrl,
            String contentType
    ) {}

    public record SubmissionView(
            Long id,
            Instant submittedAt,
            String fileName,
            String fileUrl,
            String comment,
            AssignmentStatus status,
            BigDecimal score,
            String teacherFeedback,
            Instant gradedAt
    ) {}

    public record AssignmentDetail(
            Long id,
            String title,
            String instructions,
            Instant dueAt,
            boolean allowResubmit,
            BigDecimal maxScore,
            String courseTitle,
            Long courseId,
            List<AttachmentDto> attachments,
            SubmissionView submission
    ) {}

    /** US30 — notes de l'étudiant */
    public record GradeItem(
            Long assignmentId,
            String title,
            String courseTitle,
            BigDecimal score,
            String teacherFeedback,
            Instant gradedAt
    ) {}
}