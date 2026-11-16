package com.classflow.backendspringboot.student.attendance;

import com.classflow.backendspringboot.common.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByStudentIdOrderByRecordedAtDesc(Long studentId);

    List<AttendanceRecord> findBySessionId(Long sessionId);

    Optional<AttendanceRecord> findBySessionIdAndStudentId(Long sessionId, Long studentId);

    @Query("""
        select count(a) from AttendanceRecord a
        where a.student.id = :studentId
          and a.session.course.id = :courseId
          and a.status = :status
        """)
    long countByStudentCourseStatus(
            @Param("studentId") Long studentId,
            @Param("courseId") Long courseId,
            @Param("status") AttendanceStatus status);
}