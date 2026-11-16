package com.classflow.backendspringboot.academic;

import com.classflow.backendspringboot.academic.dto.ClassResponse;
import com.classflow.backendspringboot.academic.dto.CreateNameRequest;
import com.classflow.backendspringboot.academic.dto.CreateStudentRequest;
import com.classflow.backendspringboot.academic.dto.FiliereResponse;
import com.classflow.backendspringboot.academic.dto.StudentResponse;
import com.classflow.backendspringboot.academic.dto.UpdateStudentLoginRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/filieres")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAcademicController {

    private final AdminAcademicService service;

    public AdminAcademicController(AdminAcademicService service) {
        this.service = service;
    }

    @GetMapping
    public List<FiliereResponse> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FiliereResponse createFiliere(@Valid @RequestBody CreateNameRequest request) {
        return service.createFiliere(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFiliere(@PathVariable Long id) {
        service.deleteFiliere(id);
    }

    @PostMapping("/{filiereId}/classes")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassResponse createClass(
            @PathVariable Long filiereId,
            @Valid @RequestBody CreateNameRequest request) {
        return service.createClass(filiereId, request);
    }

    @DeleteMapping("/classes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClass(@PathVariable Long id) {
        service.deleteClass(id);
    }

    @PostMapping("/classes/{classId}/students")
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse createStudent(
            @PathVariable Long classId,
            @Valid @RequestBody CreateStudentRequest request) {
        return service.createStudent(classId, request);
    }

    @PutMapping("/students/{id}/account")
    public StudentResponse updateStudentAccount(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStudentLoginRequest request) {
        return service.updateStudentAccount(id, request);
    }

    @DeleteMapping("/students/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStudent(@PathVariable Long id) {
        service.deleteStudent(id);
    }
}
