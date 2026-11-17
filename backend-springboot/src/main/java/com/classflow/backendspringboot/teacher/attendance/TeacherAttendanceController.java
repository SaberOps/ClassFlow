package com.classflow.backendspringboot.teacher.attendance;

import com.classflow.backendspringboot.common.CurrentTeacher;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher/sessions")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherAttendanceController {

    private final TeacherAttendanceService service;
    private final CurrentTeacher currentTeacher;

    public TeacherAttendanceController(TeacherAttendanceService service, CurrentTeacher currentTeacher) {
        this.service = service;
        this.currentTeacher = currentTeacher;
    }

    @GetMapping("/{sessionId}/attendance")
    public TeacherAttendanceDtos.SessionRoster roster(
            Authentication authentication, @PathVariable Long sessionId) {
        return service.roster(currentTeacher.require(authentication), sessionId);
    }

    @PutMapping("/{sessionId}/attendance")
    public TeacherAttendanceDtos.SessionRoster save(
            Authentication authentication,
            @PathVariable Long sessionId,
            @Valid @RequestBody TeacherAttendanceDtos.SaveAttendanceRequest request) {
        return service.save(currentTeacher.require(authentication), sessionId, request);
    }
}