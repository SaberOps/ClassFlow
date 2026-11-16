
package com.classflow.backendspringboot.user.admin.dto;

import com.classflow.backendspringboot.user.Role;

import java.util.Set;

public record TeacherCreatedResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role,
        Set<String> subjects,
        String temporaryPassword,
        boolean mustChangePassword
) {}
