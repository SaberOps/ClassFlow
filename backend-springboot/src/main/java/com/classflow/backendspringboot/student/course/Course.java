package com.classflow.backendspringboot.student.course;

import com.classflow.backendspringboot.academic.AcademicClass;
import com.classflow.backendspringboot.academic.classgroup.ClassGroup;
import com.classflow.backendspringboot.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30, unique = true)
    private String code;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String objectives;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_group_id")
    private ClassGroup classGroup;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "course_class_assignments",
            joinColumns = @JoinColumn(name = "course_id"),
            inverseJoinColumns = @JoinColumn(name = "class_id"))
    private java.util.Set<AcademicClass> academicClasses = new java.util.LinkedHashSet<>();

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getObjectives() { return objectives; }
    public void setObjectives(String objectives) { this.objectives = objectives; }
    public User getTeacher() { return teacher; }
    public void setTeacher(User teacher) { this.teacher = teacher; }
    public ClassGroup getClassGroup() { return classGroup; }
    public void setClassGroup(ClassGroup classGroup) { this.classGroup = classGroup; }
    public java.util.Set<AcademicClass> getAcademicClasses() { return academicClasses; }
    public void assignTo(AcademicClass academicClass) { academicClasses.add(academicClass); }
    public void unassignFrom(AcademicClass academicClass) { academicClasses.remove(academicClass); }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
