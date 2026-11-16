package com.classflow.backendspringboot.academic.enrollment;

import com.classflow.backendspringboot.student.course.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    boolean existsByCourseIdAndStudentId(Long courseId, Long studentId);

    long countByStudentId(Long studentId);

    @Query("select e.course from Enrollment e where e.student.id = :studentId and e.course.active = true")
    List<Course> findActiveCoursesByStudentId(@Param("studentId") Long studentId);
}