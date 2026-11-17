package com.classflow.backendspringboot.admin.timetable;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/timetable")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTimetableController {

    private final AdminTimetableService service;

    public AdminTimetableController(AdminTimetableService service) {
        this.service = service;
    }

    @GetMapping("/options")
    public AdminTimetableDtos.OptionsResponse options() {
        return service.options();
    }

    @GetMapping("/week")
    public AdminTimetableDtos.WeekResponse week(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam Long filiereId) {
        return service.week(start, filiereId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminTimetableDtos.SessionItem create(
            @Valid @RequestBody AdminTimetableDtos.SessionRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AdminTimetableDtos.SessionItem update(
            @PathVariable long id,
            @Valid @RequestBody AdminTimetableDtos.SessionRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
