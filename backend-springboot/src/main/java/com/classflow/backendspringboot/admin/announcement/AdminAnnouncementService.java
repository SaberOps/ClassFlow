package com.classflow.backendspringboot.admin.announcement;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminAnnouncementController {
    private final AdminAnnouncementService service;
    private final UserRepository users;

    public AdminAnnouncementController(AdminAnnouncementService service, UserRepository users) {
        this.service = service;
        this.users = users;
    }

    @GetMapping("/announcements")
    public List<AdminAnnouncementService.AnnouncementSummary> list(Authentication authentication) {
        requireAdmin(authentication);
        return service.list();
    }

    @PostMapping("/announcements")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminAnnouncementService.AnnouncementSummary create(
            Authentication authentication,
            @Valid @RequestBody AnnouncementRequest request) {
        User admin = requireAdmin(authentication);
        return service.create(admin, request);
    }

    private User requireAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Not authenticated");
        }
        User user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Admin account not found"));
        if (user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Admin role required");
        }
        return user;
    }

    public record AnnouncementRequest(
            @NotBlank(message = "Title is required") String title,
            @NotBlank(message = "Body is required") String body,
            @Pattern(regexp = "ALL|DEPARTMENT|CLASS", flags = Pattern.Flag.CASE_INSENSITIVE,
                    message = "Target type must be ALL, DEPARTMENT, or CLASS") String targetType,
            Long targetId) {}
}
