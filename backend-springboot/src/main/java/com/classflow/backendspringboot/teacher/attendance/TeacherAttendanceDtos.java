package com.classflow.backendspringboot.teacher.attendance;

import com.classflow.backendspringboot.common.AttendanceStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public final class TeacherAttendanceDtos {
    private TeacherAttendanceDtos() {}

    public record RosterEntry(
            Long studentId,
            String firstName,
            String lastName,
            String email,
            AttendanceStatus status,
            String remark,
            Instant recordedAt,
            Instant updatedAt
    ) {}

    public record SessionRoster(
            Long sessionId,
            Long courseId,
            String courseTitle,
            Instant startsAt,
            Instant endsAt,
            String room,
            List<RosterEntry> students
    ) {}

    public record AttendanceEntry(
            @NotNull Long studentId,
            @NotNull AttendanceStatus status,
            String remark
    ) {}

    public record SaveAttendanceRequest(@NotNull @Valid List<AttendanceEntry> entries) {}
}