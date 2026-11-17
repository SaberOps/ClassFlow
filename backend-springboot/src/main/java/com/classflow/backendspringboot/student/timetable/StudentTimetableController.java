package com.classflow.backendspringboot.student.timetable;

import com.classflow.backendspringboot.common.CurrentStudent;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/student/timetable")
@PreAuthorize("hasRole('STUDENT')")
public class StudentTimetableController {

    private final StudentTimetableService service;
    private final CurrentStudent currentStudent;

    public StudentTimetableController(StudentTimetableService service, CurrentStudent currentStudent) {
        this.service = service;
        this.currentStudent = currentStudent;
    }

    @GetMapping("/week")
    public TimetableDtos.WeekResponse week(
            Authentication auth,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start) {
        return service.week(currentStudent.require(auth), start);
    }
}