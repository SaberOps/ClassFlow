package com.classflow.backendspringboot.teacher.course;

import com.classflow.backendspringboot.common.ResourceType;
import com.classflow.backendspringboot.common.FileStorageService;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.student.course.CourseRepository;
import com.classflow.backendspringboot.student.resource.Resource;
import com.classflow.backendspringboot.student.resource.ResourceRepository;
import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.time.Instant;
import java.util.List;

@Service
public class TeacherCourseService {
    private final CourseRepository courses;
    private final ResourceRepository resources;
    private final FileStorageService files;

    public TeacherCourseService(CourseRepository courses, ResourceRepository resources, FileStorageService files) {
        this.courses = courses;
        this.resources = resources;
        this.files = files;
    }

    @Transactional(readOnly = true)
    public List<CourseItem> courses(User teacher) {
        return courses.findByTeacherIdAndActiveTrueOrderByTitleAsc(teacher.getId()).stream()
                .map(course -> new CourseItem(course.getId(), course.getCode(), course.getTitle(),
                        course.getDescription(), course.getClassGroup() == null ? null : course.getClassGroup().getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResourceItem> resources(User teacher, long courseId) {
        requireCourse(teacher, courseId);
        return resources.findByCourseIdOrderByPublishedAtDesc(courseId).stream()
                .map(this::toItem)
                .toList();
    }

    @Transactional
    public ResourceItem create(User teacher, long courseId, ResourceRequest request) {
        Resource resource = new Resource();
        resource.setCourse(requireCourse(teacher, courseId));
        apply(resource, request, true);
        return toItem(resources.save(resource));
    }

    @Transactional
    public ResourceItem update(User teacher, long resourceId, ResourceRequest request) {
        Resource resource = resources.findByIdAndCourseTeacherId(resourceId, teacher.getId())
                .orElseThrow(() -> new NotFoundException("Course content not found"));
        apply(resource, request, false);
        return toItem(resources.save(resource));
    }

    @Transactional
    public void delete(User teacher, long resourceId) {
        Resource resource = resources.findByIdAndCourseTeacherId(resourceId, teacher.getId())
                .orElseThrow(() -> new NotFoundException("Course content not found"));
        resources.delete(resource);
    }

    private Course requireCourse(User teacher, long courseId) {
        return courses.findByIdAndTeacherIdAndActiveTrue(courseId, teacher.getId())
                .orElseThrow(() -> new NotFoundException("Course not found"));
    }

    private void apply(Resource resource, ResourceRequest request, boolean created) {
        if (!StringUtils.hasText(request.title()) || request.title().trim().length() > 200) {
            throw new IllegalArgumentException("Title is required and must be at most 200 characters");
        }
        ResourceType type = request.resourceType();
        if (type == null || !List.of(ResourceType.TEXT, ResourceType.LINK, ResourceType.FILE).contains(type)) {
            throw new IllegalArgumentException("Content type must be text, link, or file");
        }
        if (type == ResourceType.TEXT && !StringUtils.hasText(request.contentBody())) {
            throw new IllegalArgumentException("Text content is required");
        }
        if (type == ResourceType.LINK && !isSafeUrl(request.fileUrl())) {
            throw new IllegalArgumentException("A valid http(s) or internal URL is required");
        }
        if (type == ResourceType.FILE) {
            Long fileId = storedFileId(request.fileUrl());
            if (!StringUtils.hasText(request.fileName()) || fileId == null || !files.isOwnedBy(fileId, resource.getCourse().getTeacher().getId())) {
                throw new IllegalArgumentException("Choose a file uploaded to your account");
            }
        }

        resource.setTitle(request.title().trim());
        resource.setResourceType(type);
        resource.setContentBody(type == ResourceType.TEXT ? request.contentBody().trim() : null);
        resource.setFileName(StringUtils.hasText(request.fileName())
                ? request.fileName().trim() : request.title().trim());
        resource.setFileUrl(StringUtils.hasText(request.fileUrl()) ? request.fileUrl().trim() : "");
        resource.setUpdatedAt(created ? resource.getPublishedAt() : Instant.now());
    }

    private static boolean isSafeUrl(String value) {
        if (!StringUtils.hasText(value) || value.length() > 500) return false;
        try {
            URI uri = URI.create(value.trim());
            return (uri.isAbsolute() && uri.getHost() != null
                    && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())))
                    || (!uri.isAbsolute() && value.startsWith("/") && !value.startsWith("//"));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private static Long storedFileId(String value) {
        if (value == null || !value.matches("^/api/files/[1-9][0-9]*$")) return null;
        try {
            return Long.parseLong(value.substring("/api/files/".length()));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private ResourceItem toItem(Resource resource) {
        return new ResourceItem(resource.getId(), resource.getCourse().getId(), resource.getTitle(),
                resource.getResourceType(), resource.getContentBody(), resource.getFileName(),
                resource.getFileUrl(), resource.getPublishedAt(),
                resource.getPublishedAt().equals(resource.getUpdatedAt()) ? null : resource.getUpdatedAt());
    }

    public record CourseItem(Long id, String code, String title, String description, String className) {}
    public record ResourceRequest(String title, ResourceType resourceType, String contentBody,
                                  String fileName, String fileUrl) {}
    public record ResourceItem(Long id, Long courseId, String title, ResourceType resourceType,
                               String contentBody, String fileName, String fileUrl,
                               Instant publishedAt, Instant updatedAt) {}
}
