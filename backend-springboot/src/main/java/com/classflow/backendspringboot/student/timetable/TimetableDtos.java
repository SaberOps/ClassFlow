package com.classflow.backendspringboot.student.timetable;

import java.time.Instant;
import java.util.List;

public final class TimetableDtos {
    private TimetableDtos() {}

    public record SessionItem(
            Long id,
            Long courseId,
            String courseTitle,
            String teacherName,
            Instant startsAt,
            Instant endsAt,
            String room,
            String meetingUrl,
            boolean cancelled,
            boolean lastMinuteChange,
            String changeNote
    ) {}

    public record WeekResponse(List<SessionItem> sessions) {}
}