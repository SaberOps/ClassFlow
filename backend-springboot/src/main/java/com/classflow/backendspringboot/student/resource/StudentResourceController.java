package com.classflow.backendspringboot.student.resource;

import com.classflow.backendspringboot.common.CurrentStudent;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentResourceController {

    private final StudentResourceService service;
    private final CurrentStudent currentStudent;

    public StudentResourceController(StudentResourceService service, CurrentStudent currentStudent) {
        this.service = service;
        this.currentStudent = currentStudent;
    }

    @GetMapping("/courses/{courseId}/resources")
    public List<ResourceDtos.ResourceItem> byCourse(Authentication auth, @PathVariable Long courseId) {
        return service.listByCourse(currentStudent.require(auth), courseId);
    }

    @GetMapping("/resources")
    public List<ResourceDtos.ResourceItem> search(
            Authentication auth, @RequestParam(required = false) String q) {
        return service.search(currentStudent.require(auth), q);
    }

    @GetMapping("/resources/{id}")
    public ResourceDtos.ResourceItem one(Authentication auth, @PathVariable Long id) {
        return service.getAccessible(currentStudent.require(auth), id);
    }
}