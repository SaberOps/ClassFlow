package com.classflow.backendspringboot.student.resource;

import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.ResourceType;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentResourceServiceTest {
    @Mock ResourceRepository resources;
    @Mock EnrollmentRepository enrollments;

    @Test
    void documentSearchIsScopedToTheStudentAndTheirEnrolledCourses() {
        User student = new User();
        student.setId(5L);
        Course course = new Course();
        course.setId(7L);
        course.setCode("MAT-1");
        course.setTitle("Mathématiques");
        Resource resource = new Resource();
        resource.setCourse(course);
        resource.setTitle("Notes du chapitre");
        resource.setResourceType(ResourceType.FILE);
        resource.setFileName("chapitre.pdf");
        resource.setFileUrl("/api/files/1");
        when(resources.searchAccessibleByStudent(5L, "chapitre")).thenReturn(List.of(resource));

        List<ResourceDtos.ResourceItem> result = new StudentResourceService(resources, enrollments)
                .search(student, "  Chapitre ");

        assertEquals(1, result.size());
        assertEquals("Mathématiques", result.getFirst().courseTitle());
        assertEquals("Notes du chapitre", result.getFirst().title());
        verify(resources).searchAccessibleByStudent(5L, "chapitre");
        verifyNoInteractions(enrollments);
    }

    @Test
    void blankQueryReturnsOnlyStudentEnrolledResources() {
        User student = new User();
        student.setId(5L);
        when(resources.searchAccessibleByStudent(5L, null)).thenReturn(List.of());

        List<ResourceDtos.ResourceItem> result = new StudentResourceService(resources, enrollments)
                .search(student, "  ");

        assertEquals(0, result.size());
        verify(resources).searchAccessibleByStudent(5L, null);
    }
}
