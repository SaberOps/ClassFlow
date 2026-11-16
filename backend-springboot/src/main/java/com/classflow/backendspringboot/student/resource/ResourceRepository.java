package com.classflow.backendspringboot.student.resource;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findByCourseIdOrderByPublishedAtDesc(Long courseId);

    @Query("""
        select r from Resource r
        join Enrollment e on e.course = r.course
        where e.student.id = :studentId and r.id = :resourceId
        """)
    Optional<Resource> findAccessibleByStudent(
            @Param("resourceId") Long resourceId,
            @Param("studentId") Long studentId);
}