package com.classflow.backendspringboot.teacher.course;

import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.common.FileStorageService;
import com.classflow.backendspringboot.student.course.CourseRepository;
import com.classflow.backendspringboot.student.resource.Resource;
import com.classflow.backendspringboot.student.resource.ResourceRepository;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherCourseServiceTest {
    @Mock CourseRepository courses;
    @Mock ResourceRepository resources;
    @Mock FileStorageService files;
    private TeacherCourseService service;

    @BeforeEach
    void setUp() { service = new TeacherCourseService(courses, resources, files); }

    @Test
    void teacherCannotEditAnotherTeachersCourseContent() {
        User teacher = new User();
        teacher.setId(7L);
        teacher.setRole(Role.TEACHER);
        when(resources.findByIdAndCourseTeacherId(12L, 7L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.update(teacher, 12L,
                new TeacherCourseService.ResourceRequest("Notes", com.classflow.backendspringboot.common.ResourceType.TEXT,
                        "Notes", null, null)));

        verify(resources, never()).save(any(Resource.class));
    }
}
