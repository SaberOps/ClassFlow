package com.classflow.backendspringboot.academic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AcademicClassRepository extends JpaRepository<AcademicClass, Long> {
    List<AcademicClass> findAllByOrderByNameAsc();

    @Query("select c.id from AcademicClass c where c.filiere.id = :filiereId")
    List<Long> findIdsByFiliereId(@Param("filiereId") Long filiereId);

    @Modifying
    @Query("delete from AcademicClass c where c.filiere.id = :filiereId")
    int deleteByFiliereId(@Param("filiereId") Long filiereId);
}
