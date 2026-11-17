package com.classflow.backendspringboot.teacher.assignment;

import com.classflow.backendspringboot.common.CurrentTeacher;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/assignments")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherAssignmentController {
    private final TeacherAssignmentService service;
    private final CurrentTeacher currentTeacher;

    public TeacherAssignmentController(TeacherAssignmentService service, CurrentTeacher currentTeacher) {
        this.service = service;
        this.currentTeacher = currentTeacher;
    }

    @GetMapping
    public List<TeacherAssignmentService.AssignmentItem> list(Authentication auth) {
        return service.list(currentTeacher.require(auth));
    }

    @PostMapping
    public TeacherAssignmentService.AssignmentItem create(Authentication auth,
            @Valid @RequestBody AssignmentRequest request) {
        return service.create(currentTeacher.require(auth), request.toServiceRequest());
    }

    @PutMapping("/{id}")
    public TeacherAssignmentService.AssignmentItem update(Authentication auth, @PathVariable long id,
            @Valid @RequestBody AssignmentRequest request) {
        return service.update(currentTeacher.require(auth), id, request.toServiceRequest());
    }

    @GetMapping("/{id}")
    public TeacherAssignmentService.AssignmentDetail detail(Authentication auth, @PathVariable long id) {
        return service.detail(currentTeacher.require(auth), id);
    }

    @PutMapping("/{id}/submissions/{submissionId}/grade")
    public TeacherAssignmentService.StudentWork grade(Authentication auth, @PathVariable long id,
            @PathVariable long submissionId, @Valid @RequestBody GradeRequest request) {
        return service.grade(currentTeacher.require(auth), id, submissionId,
                new TeacherAssignmentService.GradeRequest(request.score(), request.feedback()));
    }

    public record AssignmentRequest(@Positive long courseId, @NotBlank @Size(max = 200) String title,
                                    @Size(max = 20000) String instructions, @NotNull Instant dueAt,
                                    @NotNull @DecimalMin("0.01") @DecimalMax("9999.99") BigDecimal maxScore,
                                    @Valid AttachmentRequest attachment) {
        TeacherAssignmentService.AssignmentRequest toServiceRequest() {
            return new TeacherAssignmentService.AssignmentRequest(courseId, title, instructions, dueAt,
                    maxScore, attachment == null ? null : new TeacherAssignmentService.AttachmentRequest(
                    attachment.fileName(), attachment.fileUrl(), attachment.contentType()));
        }
    }
    public record AttachmentRequest(@NotBlank @Size(max = 255) String fileName,
                                    @NotBlank @Size(max = 500) String fileUrl,
                                    @Size(max = 120) String contentType) {}
    public record GradeRequest(@NotNull @DecimalMin("0.00") @DecimalMax("9999.99") BigDecimal score,
                               @Size(max = 20000) String feedback) {}
}
