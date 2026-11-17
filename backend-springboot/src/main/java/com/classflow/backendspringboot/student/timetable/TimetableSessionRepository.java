package com.classflow.backendspringboot.student.timetable;

import com.classflow.backendspringboot.academic.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TimetableSessionRepository extends JpaRepository<TimetableSession, Long> {

    @Query("""
        select s from TimetableSession s
        join Enrollment e on e.course = s.course
        where e.student.id = :studentId
          and s.startsAt >= :from and s.startsAt < :to
        order by s.startsAt asc
        """)
    List<TimetableSession> findForStudentBetween(
            @Param("studentId") Long studentId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
        select s from TimetableSession s, Student student
        where student.user.id = :studentId
          and s.academicClass.id = student.academicClass.id
          and s.startsAt >= :from and s.startsAt < :to
        order by s.startsAt asc
        """)
    List<TimetableSession> findForStudentClassBetween(
            @Param("studentId") Long studentId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
        select s from TimetableSession s
        where (s.teacher.id = :teacherId
               or (s.teacher is null and s.course.teacher.id = :teacherId))
          and s.startsAt >= :from and s.startsAt < :to
        order by s.startsAt asc
        """)
    List<TimetableSession> findForTeacherBetween(
            @Param("teacherId") Long teacherId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
        select s from TimetableSession s
        where s.startsAt >= :from and s.startsAt < :to
        order by s.startsAt asc
        """)
    List<TimetableSession> findBetween(
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
        select s from TimetableSession s
        where s.cancelled = false
          and s.startsAt < :endsAt and s.endsAt > :startsAt
          and (:excludeId is null or s.id <> :excludeId)
          and (s.academicClass.id = :classId
               or s.teacher.id = :teacherId
               or (s.teacher is null and s.course.teacher.id = :teacherId)
               or (:room is not null and lower(s.room) = lower(:room)))
        """)
    List<TimetableSession> findOverlapping(
            @Param("classId") Long classId,
            @Param("teacherId") Long teacherId,
            @Param("room") String room,
            @Param("startsAt") Instant startsAt,
            @Param("endsAt") Instant endsAt,
            @Param("excludeId") Long excludeId);

    @Query("""
        select s from TimetableSession s
        where s.id = :id
          and (s.teacher.id = :teacherId
               or (s.teacher is null and s.course.teacher.id = :teacherId))
        """)
    Optional<TimetableSession> findOwnedByTeacher(
            @Param("id") Long id,
            @Param("teacherId") Long teacherId);
}