package com.classflow.backendspringboot.admin.timetable;

import com.classflow.backendspringboot.academic.AcademicClass;
import com.classflow.backendspringboot.academic.AcademicClassRepository;
import com.classflow.backendspringboot.academic.FiliereRepository;
import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.student.course.CourseRepository;
import com.classflow.backendspringboot.student.timetable.TimetableSession;
import com.classflow.backendspringboot.student.timetable.TimetableSessionRepository;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.AdminUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class AdminTimetableService {

    private final TimetableSessionRepository sessions;
    private final AcademicClassRepository classes;
    private final FiliereRepository filieres;
    private final CourseRepository courses;
    private final AdminUserRepository users;

    public AdminTimetableService(
            TimetableSessionRepository sessions,
            AcademicClassRepository classes,
            FiliereRepository filieres,
            CourseRepository courses,
            AdminUserRepository users) {
        this.sessions = sessions;
        this.classes = classes;
        this.filieres = filieres;
        this.courses = courses;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public AdminTimetableDtos.OptionsResponse options() {
        List<AdminTimetableDtos.ClassOption> classOptions = classes.findAllByOrderByNameAsc().stream()
                .map(academicClass -> new AdminTimetableDtos.ClassOption(
                        academicClass.getId(), academicClass.getName(),
                        academicClass.getFiliere().getId(), academicClass.getFiliere().getName()))
                .toList();
        List<AdminTimetableDtos.FiliereOption> filiereOptions = filieres.findAllByOrderByNameAsc().stream()
                .map(filiere -> new AdminTimetableDtos.FiliereOption(filiere.getId(), filiere.getName()))
                .toList();
        List<AdminTimetableDtos.CourseOption> courseOptions = courses.findAllByActiveTrueOrderByTitleAsc().stream()
                .filter(course -> course.getTeacher().getRole() == Role.TEACHER
                        && course.getTeacher().isEnabled()
                        && course.getTeacher().getDeletedAt() == null)
                .map(course -> new AdminTimetableDtos.CourseOption(
                        course.getId(),
                        course.getCode(),
                        course.getTitle(),
                        course.getTeacher().getId(),
                        fullName(course.getTeacher()),
                        courses.findAssignedClasses(course.getId()).stream().map(AcademicClass::getId).toList()))
                .toList();
        List<AdminTimetableDtos.TeacherOption> teacherOptions = users
                .findAllByRoleAndEnabledTrueAndDeletedAtIsNullOrderByLastNameAscFirstNameAsc(Role.TEACHER)
                .stream()
                .map(teacher -> new AdminTimetableDtos.TeacherOption(
                        teacher.getId(),
                        teacher.getFirstName(),
                        teacher.getLastName(),
                        teacher.getEmail()))
                .toList();
        return new AdminTimetableDtos.OptionsResponse(filiereOptions, classOptions, courseOptions, teacherOptions);
    }

    @Transactional(readOnly = true)
    public AdminTimetableDtos.WeekResponse week(LocalDate start, Long filiereId) {
        Instant from = start.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = start.plusDays(7).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<AdminTimetableDtos.SessionItem> items = sessions.findForFiliereBetween(filiereId, from, to).stream()
                .map(this::toItem)
                .toList();
        return new AdminTimetableDtos.WeekResponse(items);
    }

    @Transactional
    public AdminTimetableDtos.SessionItem create(AdminTimetableDtos.SessionRequest request) {
        TimetableSession session = new TimetableSession();
        apply(session, request, null);
        return toItem(sessions.save(session));
    }

    @Transactional
    public AdminTimetableDtos.SessionItem update(long id, AdminTimetableDtos.SessionRequest request) {
        TimetableSession session = sessions.findById(id)
                .orElseThrow(() -> new NotFoundException("Timetable session not found"));
        apply(session, request, id);
        return toItem(sessions.save(session));
    }

    @Transactional
    public void delete(long id) {
        TimetableSession session = sessions.findById(id)
                .orElseThrow(() -> new NotFoundException("Timetable session not found"));
        sessions.delete(session);
    }

    private void apply(TimetableSession session, AdminTimetableDtos.SessionRequest request, Long excludeId) {
        if (!request.endsAt().isAfter(request.startsAt())) {
            throw new ConflictException("The session end time must be after its start time");
        }

        Course course = courses.findByIdAndActiveTrue(request.courseId())
                .orElseThrow(() -> new NotFoundException("Course not found"));
        AcademicClass academicClass = classes.findById(request.classId())
                .orElseThrow(() -> new NotFoundException("Class not found"));
        User teacher = users.findByIdAndDeletedAtIsNull(request.teacherId())
                .filter(user -> user.getRole() == Role.TEACHER && user.isEnabled())
                .orElseThrow(() -> new NotFoundException("Teacher not found"));
        if (!course.getTeacher().getId().equals(teacher.getId())
                || !courses.existsByIdAndAcademicClasses_Id(course.getId(), academicClass.getId())) {
            throw new ConflictException("The selected teacher, course, and class are not assigned together");
        }

        String room = normalizeRoom(request.room());
        List<TimetableSession> overlapping = sessions.findOverlapping(
                academicClass.getId(),
                teacher.getId(),
                room,
                request.startsAt(),
                request.endsAt(),
                excludeId);
        Set<String> conflicts = conflictDimensions(overlapping, academicClass, teacher, room);
        if (!conflicts.isEmpty()) {
            throw new ConflictException("Schedule conflict: " + String.join(", ", conflicts));
        }

        session.setCourse(course);
        session.setAcademicClass(academicClass);
        session.setTeacher(teacher);
        session.setStartsAt(request.startsAt());
        session.setEndsAt(request.endsAt());
        session.setRoom(room);
        session.setCancelled(false);
    }

    private static Set<String> conflictDimensions(
            List<TimetableSession> overlapping,
            AcademicClass academicClass,
            User teacher,
            String room) {
        Set<String> dimensions = new LinkedHashSet<>();
        for (TimetableSession other : overlapping) {
            if (other.getAcademicClass() != null
                    && other.getAcademicClass().getId().equals(academicClass.getId())) {
                dimensions.add("class");
            }
            User otherTeacher = other.getTeacher() == null
                    ? other.getCourse().getTeacher()
                    : other.getTeacher();
            if (otherTeacher.getId().equals(teacher.getId())) {
                dimensions.add("teacher");
            }
            if (room != null && other.getRoom() != null
                    && room.equalsIgnoreCase(other.getRoom().trim())) {
                dimensions.add("room");
            }
        }
        return dimensions;
    }

    private AdminTimetableDtos.SessionItem toItem(TimetableSession session) {
        User teacher = session.getTeacher() == null
                ? session.getCourse().getTeacher()
                : session.getTeacher();
        AcademicClass academicClass = session.getAcademicClass();
        return new AdminTimetableDtos.SessionItem(
                session.getId(),
                session.getCourse().getId(),
                session.getCourse().getTitle(),
                academicClass == null ? null : academicClass.getId(),
                academicClass == null ? null : academicClass.getName(),
                teacher.getId(),
                fullName(teacher),
                session.getStartsAt(),
                session.getEndsAt(),
                session.getRoom(),
                session.isCancelled());
    }

    private static String normalizeRoom(String room) {
        return room == null || room.isBlank() ? null : room.trim();
    }

    private static String fullName(User user) {
        return user.getFirstName() + " " + user.getLastName();
    }
}
