
package com.classflow.backendspringboot.user.admin;

import com.classflow.backendspringboot.user.admin.dto.CreateTeacherRequest;
import com.classflow.backendspringboot.user.admin.dto.TeacherCreatedResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/teachers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTeacherController {

    private final AdminTeacherService service;

    public AdminTeacherController(AdminTeacherService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeacherCreatedResponse createTeacher(
            @Valid @RequestBody CreateTeacherRequest request) {

        return service.create(request);
    }
}
