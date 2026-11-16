package com.classflow.backendspringboot.academic;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    @EntityGraph(attributePaths = "user")
    List<Student> findAllByOrderByLastNameAscFirstNameAsc();

    boolean existsByNationalIdIgnoreCase(String nationalId);

    boolean existsByNationalIdIgnoreCaseAndIdNot(String nationalId, Long id);

    @EntityGraph(attributePaths = "user")
    List<Student> findAllByAcademicClass_IdIn(Collection<Long> classIds);

    @EntityGraph(attributePaths = "user")
    Optional<Student> findWithUserById(Long id);

    @Modifying
    @Query("delete from Student s where s.academicClass.id in :classIds")
    int deleteByAcademicClassIds(@Param("classIds") Collection<Long> classIds);

    @Modifying
    @Query("delete from Student s where s.academicClass.id = :classId")
    int deleteByAcademicClassId(@Param("classId") Long classId);
}
