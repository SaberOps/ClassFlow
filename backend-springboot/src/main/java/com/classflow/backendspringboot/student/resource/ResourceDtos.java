package com.classflow.backendspringboot.student.resource;

import com.classflow.backendspringboot.common.ResourceType;
import java.time.Instant;

public final class ResourceDtos {
    private ResourceDtos() {}

    public record ResourceItem(
            Long id,
            Long courseId,
            String title,
            ResourceType resourceType,
            String fileName,
            String fileUrl,
            Instant publishedAt
    ) {}
}