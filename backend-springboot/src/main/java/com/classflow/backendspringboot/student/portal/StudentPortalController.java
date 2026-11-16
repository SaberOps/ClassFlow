package com.classflow.backendspringboot.student.portal;

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
public class StudentPortalController {
    private final StudentPortalService service;
    private final CurrentStudent currentStudent;

    public StudentPortalController(StudentPortalService service, CurrentStudent currentStudent) {
        this.service = service;
        this.currentStudent = currentStudent;
    }

    @GetMapping("/profile")
    public StudentPortalService.ProfileDto profile(Authentication auth) {
        return service.profile(currentStudent.require(auth));
    }

    @PutMapping("/profile")
    public StudentPortalService.ProfileDto updateProfile(Authentication auth,
            @Valid @RequestBody ProfileRequest request) {
        return service.updateProfile(currentStudent.require(auth),
            new StudentPortalService.ProfileUpdate(request.phone(), request.photoUrl()));
    }

    @PostMapping("/profile/password")
    public void changePassword(Authentication auth, @Valid @RequestBody PasswordRequest request) {
        service.changePassword(currentStudent.require(auth),
            new StudentPortalService.PasswordUpdate(request.currentPassword(), request.newPassword()));
    }

    @GetMapping("/notifications")
    public List<StudentPortalService.NotificationDto> notifications(Authentication auth) {
        return service.notifications(currentStudent.require(auth));
    }

    @GetMapping("/notifications/unread-count")
    public StudentPortalService.UnreadCount unreadCount(Authentication auth) {
        return service.unreadCount(currentStudent.require(auth));
    }

    @PostMapping("/notifications/{id}/read")
    public void markRead(Authentication auth, @PathVariable long id) {
        service.markRead(currentStudent.require(auth), id);
    }

    @PostMapping("/notifications/read-all")
    public void markAllRead(Authentication auth) {
        service.markAllRead(currentStudent.require(auth));
    }

    @GetMapping("/request-documents")
    public List<StudentPortalService.RequestDocumentDto> requestDocuments() {
        return service.requestDocuments();
    }

    @GetMapping("/teachers")
    public List<StudentPortalService.TeacherDto> teachers(Authentication auth) {
        return service.teachers(currentStudent.require(auth));
    }

    public record ProfileRequest(@Size(max=30) String phone, @Size(max=500) String photoUrl) {}
    public record PasswordRequest(@NotBlank String currentPassword, @NotBlank @Size(min=10,max=72) String newPassword) {}
}
