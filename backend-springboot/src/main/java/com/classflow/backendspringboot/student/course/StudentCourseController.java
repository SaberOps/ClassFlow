package com.classflow.backendspringboot.student.course;

import com.classflow.backendspringboot.common.CurrentStudent;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/courses")
@PreAuthorize("hasRole('STUDENT')")
public class StudentCourseController {

    private final StudentCourseService service;
    private final CurrentStudent currentStudent;

    public StudentCourseController(StudentCourseService service, CurrentStudent currentStudent) {
        this.service = service;
        this.currentStudent = currentStudent;
    }

    @GetMapping
    public List<CourseDtos.CourseSummary> list(
            Authentication authentication,
            @RequestParam(required = false) String q) {
        return service.list(currentStudent.require(authentication), q);
    }

    @GetMapping("/{id}")
    public CourseDtos.CourseDetail detail(Authentication authentication, @PathVariable Long id) {
        return service.detail(currentStudent.require(authentication), id);
    }
}