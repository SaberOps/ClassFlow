package com.classflow.backendspringboot.admin.timetable;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class AdminTimetableDtos {
    private AdminTimetableDtos() {}

    public record FiliereOption(Long id, String name) {}

    public record ClassOption(Long id, String name, Long filiereId, String filiereName) {}

    public record CourseOption(
            Long id,
            String code,
            String title,
            Long teacherId,
            String teacherName,
            List<Long> classIds) {}

    public record TeacherOption(Long id, String firstName, String lastName, String email) {}

    public record OptionsResponse(
            List<FiliereOption> filieres,
            List<ClassOption> classes,
            List<CourseOption> courses,
            List<TeacherOption> teachers) {}

    public record SessionRequest(
            @NotNull @Positive Long courseId,
            @NotNull @Positive Long classId,
            @NotNull @Positive Long teacherId,
            @NotNull Instant startsAt,
            @NotNull Instant endsAt,
            @Size(max = 80) String room) {}

    public record SessionItem(
            Long id,
            Long courseId,
            String courseTitle,
            Long classId,
            String className,
            Long teacherId,
            String teacherName,
            Instant startsAt,
            Instant endsAt,
            String room,
            boolean cancelled) {}

    public record WeekResponse(List<SessionItem> sessions) {}
}
