package com.classflow.backendspringboot.academic.dto;

import java.util.List;

public record FiliereResponse(Long id, String name, List<ClassResponse> classes) {
}
    