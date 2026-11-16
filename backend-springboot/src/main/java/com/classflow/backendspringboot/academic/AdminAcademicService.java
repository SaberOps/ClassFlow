package com.classflow.backendspringboot.academic;

import com.classflow.backendspringboot.academic.dto.ClassResponse;
import com.classflow.backendspringboot.academic.dto.CreateNameRequest;
import com.classflow.backendspringboot.academic.dto.CreateStudentRequest;
import com.classflow.backendspringboot.academic.dto.FiliereResponse;
import com.classflow.backendspringboot.academic.dto.StudentResponse;
import com.classflow.backendspringboot.academic.dto.UpdateStudentLoginRequest;
import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.AdminUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AdminAcademicService { 

    private final FiliereRepository filieres;
    private final AcademicClassRepository classes;
    private final StudentRepository students;
    private final AdminUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AdminAcademicService(
            FiliereRepository filieres,
            AcademicClassRepository classes,
            StudentRepository students,
            AdminUserRepository users,
            PasswordEncoder passwordEncoder) {
        this.filieres = filieres;
        this.classes = classes;
        this.students = students;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<FiliereResponse> list() {
        Map<Long, List<StudentResponse>> studentsByClass = students.findAllByOrderByLastNameAscFirstNameAsc()
                .stream()
                .collect(Collectors.groupingBy(
                        student -> student.getAcademicClass().getId(),
                        Collectors.mapping(AdminAcademicService::toResponse, Collectors.toList())));

        Map<Long, List<ClassResponse>> classesByFiliere = classes.findAllByOrderByNameAsc()
                .stream()
                .collect(Collectors.groupingBy(
                        academicClass -> academicClass.getFiliere().getId(),
                        Collectors.mapping(academicClass -> new ClassResponse(
                                academicClass.getId(),
                                academicClass.getName(),
                                studentsByClass.getOrDefault(academicClass.getId(), List.of())),
                                Collectors.toList())));

        return filieres.findAllByOrderByNameAsc()
                .stream()
                .map(filiere -> new FiliereResponse(
                        filiere.getId(),
                        filiere.getName(),
                        classesByFiliere.getOrDefault(filiere.getId(), List.of())))
                .toList();
    }

    @Transactional
    public FiliereResponse createFiliere(CreateNameRequest request) {
        Filiere saved = filieres.save(new Filiere(request.name().trim()));
        return new FiliereResponse(saved.getId(), saved.getName(), List.of());
    }

    @Transactional
    public ClassResponse createClass(Long filiereId, CreateNameRequest request) {
        Filiere filiere = findFiliere(filiereId);
        AcademicClass saved = classes.save(new AcademicClass(filiere, request.name().trim()));
        return new ClassResponse(saved.getId(), saved.getName(), List.of());
    }

    @Transactional
    public StudentResponse createStudent(Long classId, CreateStudentRequest request) {
        AcademicClass academicClass = findClass(classId);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String nationalId = request.nationalId().trim();

        if (users.findByEmailIgnoreCaseAndDeletedAtIsNull(email).isPresent()) {
            throw new ConflictException("This email is already used by another account");
        }
        if (students.existsByNationalIdIgnoreCase(nationalId)) {
            throw new ConflictException("This national ID is already registered");
        }

        User user = new User();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(nationalId));
        user.setRole(Role.STUDENT);
        user.setEnabled(true);
        User savedUser = users.save(user);

        Student saved = students.save(new Student(
                academicClass,
                request.firstName().trim(),
                request.lastName().trim(),
                nationalId,
                savedUser));
        return toResponse(saved);
    }

    @Transactional
    public StudentResponse updateStudentAccount(Long studentId, UpdateStudentLoginRequest request) {
        Student student = students.findWithUserById(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found"));
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String nationalId = request.nationalId().trim();

        User user = student.getUser();
        var existingEmailOwner = users.findByEmailIgnoreCaseAndDeletedAtIsNull(email);
        if (existingEmailOwner.isPresent()
                && (user == null || !Objects.equals(existingEmailOwner.get().getId(), user.getId()))) {
            throw new ConflictException("This email is already used by another account");
        }
        if (students.existsByNationalIdIgnoreCaseAndIdNot(nationalId, studentId)) {
            throw new ConflictException("This national ID is already registered");
        }

        if (user == null) {
            user = new User();
        }
        user.setFirstName(student.getFirstName());
        user.setLastName(student.getLastName());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(nationalId));
        user.setRole(Role.STUDENT);
        user.setEnabled(true);
        user.setDeactivatedAt(null);
        user.setDeletedAt(null);
        User savedUser = users.save(user);

        student.setNationalId(nationalId);
        student.setUser(savedUser);
        return toResponse(students.save(student));
    }

    @Transactional
    public void deleteFiliere(Long id) {
        Filiere filiere = findFiliere(id);
        List<Long> classIds = classes.findIdsByFiliereId(id);
        if (!classIds.isEmpty()) {
            softDeleteStudentAccounts(students.findAllByAcademicClass_IdIn(classIds));
            students.deleteByAcademicClassIds(classIds);
            classes.deleteByFiliereId(id);
        }
        filieres.delete(filiere);
    }

    @Transactional
    public void deleteClass(Long id) {
        AcademicClass academicClass = findClass(id);
        softDeleteStudentAccounts(students.findAllByAcademicClass_IdIn(List.of(id)));
        students.deleteByAcademicClassId(id);
        classes.delete(academicClass);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = students.findWithUserById(id)
                .orElseThrow(() -> new NotFoundException("Student not found"));
        softDeleteStudentAccounts(List.of(student));
        students.delete(student);
    }

    private Filiere findFiliere(Long id) {
        return filieres.findById(id)
                .orElseThrow(() -> new NotFoundException("Filiere not found"));
    }

    private AcademicClass findClass(Long id) {
        return classes.findById(id)
                .orElseThrow(() -> new NotFoundException("Class not found"));
    }

    private static StudentResponse toResponse(Student student) {
        User user = student.getUser();
        return new StudentResponse(
                student.getId(),
                student.getFirstName(),
                student.getLastName(),
                user == null ? null : user.getEmail(),
                student.getNationalId());
    }

    private void softDeleteStudentAccounts(List<Student> studentRecords) {
        Instant deletedAt = Instant.now();
        for (Student student : studentRecords) {
            User user = student.getUser();
            if (user != null && user.getDeletedAt() == null) {
                user.setEnabled(false);
                user.setDeactivatedAt(deletedAt);
                user.setDeletedAt(deletedAt);
                users.save(user);
            }
        }
    }
}
