package com.classflow.backendspringboot.student.attendance;

import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.AttendanceStatus;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class StudentAttendanceService {

    private final AttendanceRecordRepository attendance;
    private final EnrollmentRepository enrollments;

    public StudentAttendanceService(AttendanceRecordRepository attendance, EnrollmentRepository enrollments) {
        this.attendance = attendance;
        this.enrollments = enrollments;
    }

    @Transactional(readOnly = true)
    public AttendanceDtos.AttendanceOverview overview(User student) {
        var history = attendance.findByStudentIdOrderByRecordedAtDesc(student.getId()).stream()
                .map(a -> new AttendanceDtos.AttendanceItem(
                        a.getId(),
                        a.getSession().getCourse().getId(),
                        a.getSession().getCourse().getTitle(),
                        a.getSession().getStartsAt(),
                        a.getStatus(),
                        a.getRemark()))
                .toList();

        List<AttendanceDtos.CourseAttendanceSummary> byCourse = new ArrayList<>();
        for (Course c : enrollments.findActiveCoursesByStudentId(student.getId())) {
            long present = attendance.countByStudentCourseStatus(student.getId(), c.getId(), AttendanceStatus.PRESENT);
            long absent = attendance.countByStudentCourseStatus(student.getId(), c.getId(), AttendanceStatus.ABSENT);
            long late = attendance.countByStudentCourseStatus(student.getId(), c.getId(), AttendanceStatus.LATE);
            long total = present + absent + late;
            double rate = total == 0 ? 100.0 : Math.round(present * 1000.0 / total) / 10.0;
            byCourse.add(new AttendanceDtos.CourseAttendanceSummary(
                    c.getId(), c.getTitle(), present, absent, late, rate));
        }
        return new AttendanceDtos.AttendanceOverview(history, byCourse);
    }
}