package com.classflow.backendspringboot.user.admin.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull Boolean enabled) {
}
