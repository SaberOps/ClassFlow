package com.classflow.backendspringboot.student.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByCourseIdOrderByDueAtAsc(Long courseId);

    List<Assignment> findByCourseTeacherIdOrderByDueAtAsc(Long teacherId);

    Optional<Assignment> findByIdAndCourseTeacherId(Long id, Long teacherId);

    @Query("""
        select a from Assignment a
        join Enrollment e on e.course = a.course
        where e.student.id = :studentId
        order by a.dueAt asc
        """)
    List<Assignment> findAllForStudent(@Param("studentId") Long studentId);
}