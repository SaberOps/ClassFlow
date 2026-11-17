package com.classflow.backendspringboot.teacher.portal;

import com.classflow.backendspringboot.common.CurrentTeacher;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherPortalController {
    private final TeacherPortalService service;
    private final CurrentTeacher currentTeacher;

    public TeacherPortalController(TeacherPortalService service, CurrentTeacher currentTeacher) {
        this.service = service;
        this.currentTeacher = currentTeacher;
    }

    @GetMapping("/profile")
    public TeacherPortalService.ProfileDto profile(Authentication auth) {
        return service.profile(currentTeacher.require(auth));
    }

    @PutMapping("/profile")
    public TeacherPortalService.ProfileDto updateProfile(Authentication auth,
            @Valid @RequestBody ProfileRequest request) {
        return service.updateProfile(currentTeacher.require(auth),
                new TeacherPortalService.ProfileUpdate(request.phone(), request.photoUrl()));
    }

    @PostMapping("/profile/password")
    public void changePassword(Authentication auth, @Valid @RequestBody PasswordRequest request) {
        service.changePassword(currentTeacher.require(auth),
                new TeacherPortalService.PasswordUpdate(request.currentPassword(), request.newPassword()));
    }

    @GetMapping("/notifications")
    public List<TeacherPortalService.NotificationDto> notifications(Authentication auth) {
        return service.notifications(currentTeacher.require(auth));
    }

    @GetMapping("/notifications/unread-count")
    public TeacherPortalService.UnreadCount unreadCount(Authentication auth) {
        return service.unreadCount(currentTeacher.require(auth));
    }

    @PostMapping("/notifications/{id}/read")
    public void markRead(Authentication auth, @PathVariable long id) {
        service.markRead(currentTeacher.require(auth), id);
    }

    @PostMapping("/notifications/read-all")
    public void markAllRead(Authentication auth) {
        service.markAllRead(currentTeacher.require(auth));
    }

    public record ProfileRequest(@Size(max = 30) String phone, @Size(max = 500) String photoUrl) {}
    public record PasswordRequest(@NotBlank String currentPassword,
                                  @NotBlank @Size(min = 10, max = 72) String newPassword) {}
}
