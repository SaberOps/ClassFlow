package com.classflow.backendspringboot.academic.dto;

import java.util.List;

public record ClassResponse(Long id, String name, List<StudentResponse> students) {
}
