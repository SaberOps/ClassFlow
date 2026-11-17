package com.classflow.backendspringboot.user.admin.dto;

public record TemporaryPasswordResponse(
        Long userId,
        String email,
        String temporaryPassword,
        boolean mustChangePassword
) {
}
