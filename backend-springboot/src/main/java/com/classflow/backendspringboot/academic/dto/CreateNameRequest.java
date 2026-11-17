package com.classflow.backendspringboot.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateNameRequest(
        @NotBlank @Size(max = 120) String name
) {
}
