package com.classflow.backendspringboot.user.admin.dto;

import com.classflow.backendspringboot.user.Role;

import java.time.Instant;

/** Account as seen by the administration. Never contains the password hash. */
public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role,
        boolean enabled,
        Instant deactivatedAt
) {
}
