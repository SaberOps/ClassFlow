package com.classflow.backendspringboot.academic;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "classes")
public class AcademicClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filiere_id", nullable = false)
    private Filiere filiere;

    @Column(nullable = false, length = 120)
    private String name;

    protected AcademicClass() {
    }

    public AcademicClass(Filiere filiere, String name) {
        this.filiere = filiere;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public Filiere getFiliere() {
        return filiere;
    }

    public String getName() {
        return name;
    }
}
