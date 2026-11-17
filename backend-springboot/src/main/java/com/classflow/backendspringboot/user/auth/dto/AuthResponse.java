package com.classflow.backendspringboot.user.auth.dto;

import com.classflow.backendspringboot.user.Role;

public record AuthResponse(String email, Role role, boolean mustChangePassword) {
}
