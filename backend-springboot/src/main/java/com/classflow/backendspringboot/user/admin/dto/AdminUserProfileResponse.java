package com.classflow.backendspringboot.user.admin.dto;

import com.classflow.backendspringboot.user.Role;

import java.time.Instant;
import java.util.List;

public record AdminUserProfileResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role,
        boolean enabled,
        Instant deactivatedAt,
        String phone,
        String photoUrl,
        String studentNumber,
        String departmentName,
        String className,
        List<String> subjects,
        List<String> courses,
        boolean mustChangePassword
) {
}
