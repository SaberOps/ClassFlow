package com.classflow.backendspringboot.student.attendance;

import com.classflow.backendspringboot.common.CurrentStudent;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/attendance")
@PreAuthorize("hasRole('STUDENT')")
public class StudentAttendanceController {

    private final StudentAttendanceService service;
    private final CurrentStudent currentStudent;

    public StudentAttendanceController(StudentAttendanceService service, CurrentStudent currentStudent) {
        this.service = service;
        this.currentStudent = currentStudent;
    }

    @GetMapping
    public AttendanceDtos.AttendanceOverview overview(Authentication auth) {
        return service.overview(currentStudent.require(auth));
    }
}