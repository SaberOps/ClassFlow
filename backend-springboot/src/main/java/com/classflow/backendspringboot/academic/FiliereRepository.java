package com.classflow.backendspringboot.academic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FiliereRepository extends JpaRepository<Filiere, Long> {
    List<Filiere> findAllByOrderByNameAsc();
}
