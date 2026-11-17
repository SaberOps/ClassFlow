package com.classflow.backendspringboot.teacher.course;

import com.classflow.backendspringboot.common.CurrentTeacher;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherCourseController {
    private final TeacherCourseService service;
    private final CurrentTeacher currentTeacher;

    public TeacherCourseController(TeacherCourseService service, CurrentTeacher currentTeacher) {
        this.service = service;
        this.currentTeacher = currentTeacher;
    }

    @GetMapping("/courses")
    public List<TeacherCourseService.CourseItem> courses(Authentication auth) {
        return service.courses(currentTeacher.require(auth));
    }

    @PostMapping("/courses")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public TeacherCourseService.CourseItem createCourse(
            Authentication auth, @Valid @RequestBody CreateCourseRequest request) {
        return service.createCourse(currentTeacher.require(auth),
                new TeacherCourseService.CourseRequest(request.title(), request.description()));
    }

    @GetMapping("/courses/{courseId}/students")
    public List<TeacherCourseService.StudentItem> students(Authentication auth, @PathVariable long courseId) {
        return service.students(currentTeacher.require(auth), courseId);
    }

    @GetMapping("/courses/{courseId}/content")
    public List<TeacherCourseService.ResourceItem> content(Authentication auth, @PathVariable long courseId) {
        return service.resources(currentTeacher.require(auth), courseId);
    }

    @PostMapping("/courses/{courseId}/content")
    public TeacherCourseService.ResourceItem create(Authentication auth, @PathVariable long courseId,
                                                     @Valid @RequestBody ContentRequest request) {
        return service.create(currentTeacher.require(auth), courseId, request.toServiceRequest());
    }

    @PutMapping("/content/{id}")
    public TeacherCourseService.ResourceItem update(Authentication auth, @PathVariable long id,
                                                     @Valid @RequestBody ContentRequest request) {
        return service.update(currentTeacher.require(auth), id, request.toServiceRequest());
    }

    @DeleteMapping("/content/{id}")
    public void delete(Authentication auth, @PathVariable long id) {
        service.delete(currentTeacher.require(auth), id);
    }

    public record ContentRequest(@NotBlank @Size(max = 200) String title,
                                 @NotNull com.classflow.backendspringboot.common.ResourceType resourceType,
                                 @Size(max = 20000) String contentBody,
                                 @Size(max = 255) String fileName,
                                 @Size(max = 500) String fileUrl) {
        TeacherCourseService.ResourceRequest toServiceRequest() {
            return new TeacherCourseService.ResourceRequest(title, resourceType, contentBody, fileName, fileUrl);
        }
    }

    public record CreateCourseRequest(@NotBlank @Size(max = 200) String title,
                                      @Size(max = 5000) String description) {}
}
