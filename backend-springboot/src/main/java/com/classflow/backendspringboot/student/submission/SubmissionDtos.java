package com.classflow.backendspringboot.student.submission;

import com.classflow.backendspringboot.common.AssignmentStatus;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.Instant;

public final class SubmissionDtos {

    private SubmissionDtos() {}

    public record SubmitRequest(
            @NotBlank String fileName,
            @NotBlank String fileUrl,
            String comment
    ) {}

    public record SubmissionDto(
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
}