package com.classflow.backendspringboot.student.course;

import java.time.Instant;
import java.util.List;

public final class CourseDtos {
    private CourseDtos() {}

    public record CourseSummary(Long id, String code, String title, String teacherName, String teacherEmail) {}

    public record TeacherInfo(Long id, String firstName, String lastName, String email) {}

    public record ResourceBrief(Long id, String title, String fileName, String fileUrl, Instant publishedAt) {}

    public record AssignmentBrief(Long id, String title, Instant dueAt) {}

    public record CourseDetail(
            Long id,
            String code,
            String title,
            String description,
            String objectives,
            TeacherInfo teacher,
            List<ResourceBrief> resources,
            List<AssignmentBrief> assignments
    ) {}
}