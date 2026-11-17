package com.classflow.backendspringboot.teacher.timetable;

import com.classflow.backendspringboot.common.CurrentTeacher;
import com.classflow.backendspringboot.student.timetable.TimetableDtos;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/teacher/timetable")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherTimetableController {

    private final TeacherTimetableService service;
    private final CurrentTeacher currentTeacher;

    public TeacherTimetableController(TeacherTimetableService service, CurrentTeacher currentTeacher) {
        this.service = service;
        this.currentTeacher = currentTeacher;
    }

    @GetMapping("/week")
    public TimetableDtos.WeekResponse week(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start) {
        return service.week(currentTeacher.require(authentication), start);
    }
}