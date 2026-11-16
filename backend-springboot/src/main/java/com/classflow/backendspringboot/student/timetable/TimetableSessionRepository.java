package com.classflow.backendspringboot.student.timetable;

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
        select s from TimetableSession s
        where s.course.teacher.id = :teacherId
          and s.startsAt >= :from and s.startsAt < :to
        order by s.startsAt asc
        """)
    List<TimetableSession> findForTeacherBetween(
            @Param("teacherId") Long teacherId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
        select s from TimetableSession s
        where s.id = :id and s.course.teacher.id = :teacherId
        """)
    Optional<TimetableSession> findOwnedByTeacher(
            @Param("id") Long id,
            @Param("teacherId") Long teacherId);
}