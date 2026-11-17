package com.classflow.backendspringboot.student.resource;

import com.classflow.backendspringboot.common.ResourceType;
import java.time.Instant;

public final class ResourceDtos {
    private ResourceDtos() {}

    public record ResourceItem(
            Long id,
            Long courseId,
            String courseTitle,
            String courseCode,
            String title,
            ResourceType resourceType,
            String contentBody,
            String fileName,
            String fileUrl,
            Instant publishedAt
    ) {}
}