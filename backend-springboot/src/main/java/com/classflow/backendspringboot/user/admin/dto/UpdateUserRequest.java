package com.classflow.backendspringboot.user.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Editable account fields. The role is intentionally NOT editable here.
 * Add the other editable fields of your model (phone, class, filiere...) once the team confirms them.
 */
public record UpdateUserRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Email @Size(max = 255) String email
) {
}
