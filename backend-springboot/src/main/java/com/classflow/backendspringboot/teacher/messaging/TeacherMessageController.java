package com.classflow.backendspringboot.teacher.messaging;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/messages")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherMessageController {
    private final TeacherMessageService service;

    public TeacherMessageController(TeacherMessageService service) {
        this.service=service;
    }

    @GetMapping
    public List<TeacherMessageService.MessageDto> conversation(Authentication auth,
            @RequestParam long courseId,@RequestParam long studentId) {
        return service.conversation(auth.getName(),courseId,studentId);
    }

    @PostMapping
    public TeacherMessageService.MessageDto reply(Authentication auth,@Valid @RequestBody ReplyRequest request) {
        return service.reply(auth.getName(),request.courseId(),request.studentId(),request.body());
    }

    public record ReplyRequest(long courseId,long studentId,@NotBlank @Size(max=4000) String body) {}
}
