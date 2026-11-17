package com.classflow.backendspringboot.academic.enrollment;

import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    boolean existsByCourseIdAndStudentId(Long courseId, Long studentId);

    @Modifying
    @Query(value = "INSERT IGNORE INTO enrollments (course_id, student_id) VALUES (:courseId, :studentId)",
            nativeQuery = true)
    int insertIfAbsent(@Param("courseId") Long courseId, @Param("studentId") Long studentId);

    long countByStudentId(Long studentId);

    List<Enrollment> findByCourseId(Long courseId);

    @Query("select e.student from Enrollment e where e.course.id = :courseId and e.student.role = :role "
            + "order by e.student.lastName, e.student.firstName")
    List<User> findStudentsByCourseId(@Param("courseId") Long courseId, @Param("role") Role role);

    @Query("select e.course from Enrollment e where e.student.id = :studentId and e.course.active = true")
    List<Course> findActiveCoursesByStudentId(@Param("studentId") Long studentId);
}