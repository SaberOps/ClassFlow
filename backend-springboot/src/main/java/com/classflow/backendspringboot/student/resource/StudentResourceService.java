package com.classflow.backendspringboot.student.resource;

import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentResourceService {

    private final ResourceRepository resources;
    private final EnrollmentRepository enrollments;

    public StudentResourceService(ResourceRepository resources, EnrollmentRepository enrollments) {
        this.resources = resources;
        this.enrollments = enrollments;
    }

    @Transactional(readOnly = true)
    public List<ResourceDtos.ResourceItem> listByCourse(User student, Long courseId) {
        if (!enrollments.existsByCourseIdAndStudentId(courseId, student.getId())) {
            throw new NotFoundException("Course not found");
        }
        return resources.findByCourseIdOrderByPublishedAtDesc(courseId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResourceDtos.ResourceItem getAccessible(User student, Long resourceId) {
        Resource r = resources.findAccessibleByStudent(resourceId, student.getId())
                .orElseThrow(() -> new NotFoundException("Resource not found"));
        return toDto(r);
    }

    private ResourceDtos.ResourceItem toDto(Resource r) {
        return new ResourceDtos.ResourceItem(
                r.getId(),
                r.getCourse().getId(),
                r.getTitle(),
                r.getResourceType(),
                r.getFileName(),
                r.getFileUrl(),
                r.getPublishedAt());
    }
}