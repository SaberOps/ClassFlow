package com.classflow.backendspringboot.student.course;

import com.classflow.backendspringboot.academic.AcademicClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByIdAndActiveTrue(Long id);
    List<Course> findAllByActiveTrueOrderByTitleAsc();
    List<Course> findByTeacherIdAndActiveTrueOrderByTitleAsc(Long teacherId);
    @Query("select c from Course c join c.academicClasses ac where ac.id = :classId and c.active = true")
    List<Course> findByAssignedClassIdAndActiveTrue(@Param("classId") Long academicClassId);
    Optional<Course> findByIdAndTeacherIdAndActiveTrue(Long id, Long teacherId);

    @Modifying
    @Query(value = "delete from course_class_assignments where class_id in (:classIds)", nativeQuery = true)
    int clearAcademicClassAssignments(@Param("classIds") Collection<Long> classIds);

    @Modifying
    @Query(value = "delete from course_class_assignments where course_id = :courseId and class_id = :classId",
            nativeQuery = true)
    int unassignClass(@Param("courseId") Long courseId, @Param("classId") Long classId);

    boolean existsByIdAndAcademicClasses_Id(Long courseId, Long classId);

    @Query("select ac from Course c join c.academicClasses ac where c.id = :courseId order by ac.name")
    List<AcademicClass> findAssignedClasses(@Param("courseId") Long courseId);
}