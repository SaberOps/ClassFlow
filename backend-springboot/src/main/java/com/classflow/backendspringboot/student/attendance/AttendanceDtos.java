package com.classflow.backendspringboot.student.attendance;

import com.classflow.backendspringboot.common.AttendanceStatus;
import java.time.Instant;
import java.util.List;

public final class AttendanceDtos {
    private AttendanceDtos() {}

    public record AttendanceItem(
            Long id,
            Long courseId,
            String courseTitle,
            Instant sessionStartsAt,
            AttendanceStatus status,
            String remark
    ) {}

    public record CourseAttendanceSummary(
            Long courseId,
            String courseTitle,
            long present,
            long absent,
            long late,
            double presenceRate
    ) {}

    public record AttendanceOverview(
            List<AttendanceItem> history,
            List<CourseAttendanceSummary> byCourse
    ) {}
}