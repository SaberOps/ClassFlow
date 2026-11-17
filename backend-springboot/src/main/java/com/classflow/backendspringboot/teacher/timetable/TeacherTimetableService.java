package com.classflow.backendspringboot.teacher.timetable;

import com.classflow.backendspringboot.student.timetable.TimetableDtos;
import com.classflow.backendspringboot.student.timetable.TimetableSessionRepository;
import com.classflow.backendspringboot.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
public class TeacherTimetableService {

    private final TimetableSessionRepository sessions;

    public TeacherTimetableService(TimetableSessionRepository sessions) {
        this.sessions = sessions;
    }

    @Transactional(readOnly = true)
    public TimetableDtos.WeekResponse week(User teacher, LocalDate start) {
        Instant from = start.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = start.plusDays(7).atStartOfDay().toInstant(ZoneOffset.UTC);
        var items = sessions.findForTeacherBetween(teacher.getId(), from, to).stream()
                .map(s -> new TimetableDtos.SessionItem(
                        s.getId(),
                        s.getCourse().getId(),
                        s.getCourse().getTitle(),
                        teacher.getFirstName() + " " + teacher.getLastName(),
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
}