package com.classflow.backendspringboot.student.extended;

import com.classflow.backendspringboot.common.CurrentStudent;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentExtendedController {
    private final StudentExtendedService service;
    private final CurrentStudent currentStudent;

    public StudentExtendedController(StudentExtendedService service,CurrentStudent currentStudent) {
        this.service=service;
        this.currentStudent=currentStudent;
    }

    @GetMapping("/messages")
    public List<StudentExtendedService.MessageDto> messages(Authentication auth,@RequestParam long courseId) {
        return service.messages(currentStudent.require(auth),courseId);
    }

    @PostMapping("/messages")
    public StudentExtendedService.MessageDto sendMessage(Authentication auth,
            @Valid @RequestBody MessageRequest request) {
        return service.sendMessage(currentStudent.require(auth),
            new StudentExtendedService.MessageRequest(request.courseId(),request.body()));
    }

    @GetMapping("/attendance/justifications")
    public List<StudentExtendedService.JustificationDto> justifications(Authentication auth) {
        return service.justifications(currentStudent.require(auth));
    }

    @PostMapping("/attendance/justifications")
    public StudentExtendedService.JustificationDto submitJustification(Authentication auth,
            @Valid @RequestBody JustificationRequest request) {
        return service.submitJustification(currentStudent.require(auth),
            new StudentExtendedService.JustificationRequest(request.attendanceRecordId(),request.fileName(),
                request.fileUrl(),request.comment()));
    }

    @GetMapping("/feed")
    public List<StudentExtendedService.FeedItemDto> feed(Authentication auth) {
        return service.feed(currentStudent.require(auth));
    }

    public record MessageRequest(long courseId,@NotBlank @Size(max=4000) String body) {}
    public record JustificationRequest(long attendanceRecordId,@NotBlank String fileName,
                                       @NotBlank String fileUrl,@Size(max=1000) String comment) {}
}
