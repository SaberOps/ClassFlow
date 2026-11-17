package com.classflow.backendspringboot.student.timetable;

import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;

@Service
public class StudentTimetableService {

    private final TimetableSessionRepository sessions;

    public StudentTimetableService(TimetableSessionRepository sessions) {
        this.sessions = sessions;
    }

    @Transactional(readOnly = true)
    public TimetableDtos.WeekResponse week(User student, LocalDate start) {
        Instant from = start.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = start.plusDays(7).atStartOfDay().toInstant(ZoneOffset.UTC);
        var items = sessions.findForStudentClassBetween(student.getId(), from, to).stream()
                .sorted(Comparator.comparing(TimetableSession::getStartsAt))
                .map(s -> new TimetableDtos.SessionItem(
                        s.getId(),
                        s.getCourse().getId(),
                        s.getCourse().getTitle(),
                        teacherName(s),
                        s.getAcademicClass() == null ? null : s.getAcademicClass().getName(),
                        s.getStartsAt(),
                        s.getEndsAt(),
                        s.getRoom(),
                        s.getMeetingUrl(),
                        s.isCancelled(),
                        s.isLastMinuteChange(),
                        s.getChangeNote()))
                .toList();
        return new TimetableDtos.WeekResponse(items);
    }

    private static String teacherName(TimetableSession session) {
        var teacher = session.getTeacher() == null
                ? session.getCourse().getTeacher()
                : session.getTeacher();
        return teacher.getFirstName() + " " + teacher.getLastName();
    }
}