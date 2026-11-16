package com.classflow.backendspringboot.academic;

import com.classflow.backendspringboot.academic.dto.CreateNameRequest;
import com.classflow.backendspringboot.academic.dto.CreateStudentRequest;
import com.classflow.backendspringboot.academic.dto.StudentResponse;
import com.classflow.backendspringboot.academic.dto.UpdateStudentLoginRequest;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.AdminUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminAcademicServiceTest {

    @Mock
    private FiliereRepository filieres;

    @Mock
    private AcademicClassRepository classes;

    @Mock
    private StudentRepository students;

    @Mock
    private AdminUserRepository users;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminAcademicService service;

    @Test
    void deletingFiliereDeletesItsStudentsAndClassesFirst() {
        Filiere filiere = new Filiere("Informatique");
        when(filieres.findById(1L)).thenReturn(Optional.of(filiere));
        when(classes.findIdsByFiliereId(1L)).thenReturn(List.of(10L, 11L));

        service.deleteFiliere(1L);

        verify(students).deleteByAcademicClassIds(List.of(10L, 11L));
        verify(classes).deleteByFiliereId(1L);
        verify(filieres).delete(filiere);
    }

    @Test
    void creatingClassRequiresAnExistingFiliere() {
        when(filieres.findById(99L)).thenReturn(Optional.empty());

        assertThrows(
                NotFoundException.class,
                () -> service.createClass(99L, new CreateNameRequest("Year 1")));
    }

    @Test
    void creatingStudentUsesNationalIdAsHashedStudentPassword() {
        when(classes.findById(2L)).thenReturn(Optional.of(new AcademicClass(new Filiere("IT"), "Year 1")));
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull("student@example.com"))
                .thenReturn(Optional.empty());
        when(students.existsByNationalIdIgnoreCase("ab123456")).thenReturn(false);
        when(passwordEncoder.encode("ab123456")).thenReturn("bcrypt-hash");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(students.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StudentResponse response = service.createStudent(
                2L,
                new CreateStudentRequest("Sam", "Student", "STUDENT@example.com", "ab123456"));

        var savedUser = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users).save(savedUser.capture());
        assertEquals(Role.STUDENT, savedUser.getValue().getRole());
        assertEquals("student@example.com", savedUser.getValue().getEmail());
        assertEquals("bcrypt-hash", savedUser.getValue().getPasswordHash());
        assertEquals("student@example.com", response.email());
        assertEquals("ab123456", response.nationalId());
        verify(passwordEncoder).encode("ab123456");
    }

    @Test
    void deletingFiliereSoftDeletesLinkedStudentAccounts() {
        Filiere filiere = new Filiere("Informatique");
        User user = new User();
        user.setRole(Role.STUDENT);
        Student student = new Student(
                new AcademicClass(filiere, "Year 1"),
                "Sam",
                "Student",
                "AB123456",
                user);
        when(filieres.findById(1L)).thenReturn(Optional.of(filiere));
        when(classes.findIdsByFiliereId(1L)).thenReturn(List.of(10L));
        when(students.findAllByAcademicClass_IdIn(List.of(10L))).thenReturn(List.of(student));

        service.deleteFiliere(1L);

        verify(users).save(user);
        assertFalse(user.isEnabled());
        assertNotNull(user.getDeletedAt());
        verify(students).deleteByAcademicClassIds(List.of(10L));
    }

    @Test
    void settingLoginDetailsOnLegacyStudentCreatesStudentAccount() {
        Student student = new Student(
                new AcademicClass(new Filiere("IT"), "Year 1"),
                "Sam",
                "Student",
                null,
                null);
        when(students.findWithUserById(3L)).thenReturn(Optional.of(student));
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull("student@example.com"))
                .thenReturn(Optional.empty());
        when(students.existsByNationalIdIgnoreCaseAndIdNot("12345678", 3L)).thenReturn(false);
        when(passwordEncoder.encode("12345678")).thenReturn("bcrypt-hash");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(students.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StudentResponse response = service.updateStudentAccount(
                3L,
                new UpdateStudentLoginRequest("STUDENT@example.com", "12345678"));

        assertEquals("student@example.com", response.email());
        assertEquals("12345678", response.nationalId());
        assertEquals(Role.STUDENT, student.getUser().getRole());
        assertEquals("bcrypt-hash", student.getUser().getPasswordHash());
        assertEquals("12345678", student.getNationalId());
    }
}
