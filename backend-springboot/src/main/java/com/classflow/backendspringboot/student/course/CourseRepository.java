package com.classflow.backendspringboot.student.course;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByIdAndActiveTrue(Long id);
    List<Course> findByTeacherIdAndActiveTrueOrderByTitleAsc(Long teacherId);
    Optional<Course> findByIdAndTeacherIdAndActiveTrue(Long id, Long teacherId);
}