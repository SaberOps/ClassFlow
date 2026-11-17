package com.classflow.backendspringboot.academic.dto;

public record StudentResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String nationalId) {
}
