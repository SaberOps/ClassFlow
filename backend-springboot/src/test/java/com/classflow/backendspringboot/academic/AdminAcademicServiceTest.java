package com.classflow.backendspringboot.academic;

import com.classflow.backendspringboot.academic.dto.CreateNameRequest;
import com.classflow.backendspringboot.academic.dto.CreateStudentRequest;
import com.classflow.backendspringboot.academic.dto.StudentResponse;
import com.classflow.backendspringboot.academic.dto.UpdateStudentLoginRequest;
import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.student.course.CourseRepository;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.AdminUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

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

    @Mock
    private CourseRepository courses;

    @Mock
    private EnrollmentRepository enrollments;

    @InjectMocks
    private AdminAcademicService service;

    @Test
    void deletingFiliereDeletesItsStudentsAndClassesFirst() {
        Filiere filiere = new Filiere("Informatique");
        when(filieres.findById(1L)).thenReturn(Optional.of(filiere));
        when(classes.findIdsByFiliereId(1L)).thenReturn(List.of(10L, 11L));

        service.deleteFiliere(1L);

        verify(courses).clearAcademicClassAssignments(List.of(10L, 11L));
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
    void deletingClassUnassignsCoursesWithoutDeletingThem() {
        when(classes.findById(2L)).thenReturn(Optional.of(academicClassWithId(2L)));

        service.deleteClass(2L);

        verify(courses).clearAcademicClassAssignments(List.of(2L));
        verify(courses, never()).delete(any(Course.class));
        verify(students).deleteByAcademicClassId(2L);
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

    @Test
    void assigningOwnedCourseEnrollsClassStudentsIdempotently() {
        AcademicClass academicClass = academicClassWithId(2L);
        User teacher = new User();
        teacher.setId(8L);
        teacher.setRole(Role.TEACHER);
        User studentUser = new User();
        studentUser.setId(20L);
        studentUser.setRole(Role.STUDENT);
        Student student = new Student(academicClass, "Sam", "Student", "123", studentUser);
        Course course = new Course();
        course.setId(30L);
        course.setTeacher(teacher);

        when(users.findByIdAndDeletedAtIsNull(8L)).thenReturn(Optional.of(teacher));
        when(courses.findByIdAndTeacherIdAndActiveTrue(30L, 8L)).thenReturn(Optional.of(course));
        when(classes.findById(2L)).thenReturn(Optional.of(academicClass));
        when(students.findAllByAcademicClass_IdIn(List.of(2L))).thenReturn(List.of(student));
        when(courses.save(course)).thenReturn(course);

        service.assignCourse(new AdminAcademicService.CourseAssignmentRequest(8L, 30L, 2L));
        service.assignCourse(new AdminAcademicService.CourseAssignmentRequest(8L, 30L, 2L));

        assertTrue(course.getAcademicClasses().contains(academicClass));
        assertEquals(1, course.getAcademicClasses().size());
        verify(enrollments, times(2)).insertIfAbsent(30L, 20L);
    }

    @Test
    void assigningCourseToMultipleClassesEnrollsOnlyEachClassStudents() {
        AcademicClass classA = academicClassWithId(2L);
        AcademicClass classB = academicClassWithId(3L);
        User teacher = new User();
        teacher.setId(8L);
        teacher.setRole(Role.TEACHER);
        User studentA = new User();
        studentA.setId(20L);
        studentA.setRole(Role.STUDENT);
        User studentB = new User();
        studentB.setId(21L);
        studentB.setRole(Role.STUDENT);
        Course course = new Course();
        course.setId(30L);
        course.setTeacher(teacher);
        Student recordA = new Student(classA, "A", "Student", "123", studentA);
        Student recordB = new Student(classB, "B", "Student", "456", studentB);

        when(users.findByIdAndDeletedAtIsNull(8L)).thenReturn(Optional.of(teacher));
        when(courses.findByIdAndTeacherIdAndActiveTrue(30L, 8L)).thenReturn(Optional.of(course));
        when(classes.findById(2L)).thenReturn(Optional.of(classA));
        when(classes.findById(3L)).thenReturn(Optional.of(classB));
        when(students.findAllByAcademicClass_IdIn(List.of(2L))).thenReturn(List.of(recordA));
        when(students.findAllByAcademicClass_IdIn(List.of(3L))).thenReturn(List.of(recordB));
        when(courses.save(course)).thenReturn(course);

        service.assignCourse(new AdminAcademicService.CourseAssignmentRequest(8L, 30L, 2L));
        service.assignCourse(new AdminAcademicService.CourseAssignmentRequest(8L, 30L, 3L));

        assertTrue(course.getAcademicClasses().containsAll(List.of(classA, classB)));
        verify(enrollments).insertIfAbsent(30L, 20L);
        verify(enrollments).insertIfAbsent(30L, 21L);
    }

    @Test
    void unassigningCoursePreservesExistingEnrollments() {
        when(courses.findByIdAndActiveTrue(30L)).thenReturn(Optional.of(new Course()));
        when(classes.findById(2L)).thenReturn(Optional.of(academicClassWithId(2L)));

        service.unassignCourse(30L, 2L);

        verify(courses).unassignClass(30L, 2L);
        verifyNoInteractions(enrollments);
    }

    @Test
    void creatingStudentEnrollsThemInCoursesAlreadyAssignedToTheirClass() {
        AcademicClass academicClass = academicClassWithId(2L);
        Course course = new Course();
        course.setId(30L);
        when(classes.findById(2L)).thenReturn(Optional.of(academicClass));
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull("student@example.com")).thenReturn(Optional.empty());
        when(students.existsByNationalIdIgnoreCase("ab123456")).thenReturn(false);
        when(passwordEncoder.encode("ab123456")).thenReturn("bcrypt-hash");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(20L);
            return saved;
        });
        when(students.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(courses.findByAssignedClassIdAndActiveTrue(2L)).thenReturn(List.of(course));

        service.createStudent(2L, new CreateStudentRequest("Sam", "Student", "student@example.com", "ab123456"));

        verify(enrollments).insertIfAbsent(30L, 20L);
    }

    @Test
    void assigningCourseRejectsCourseOwnedByAnotherTeacher() {
        User teacher = new User();
        teacher.setId(8L);
        teacher.setRole(Role.TEACHER);
        when(users.findByIdAndDeletedAtIsNull(8L)).thenReturn(Optional.of(teacher));
        when(courses.findByIdAndTeacherIdAndActiveTrue(30L, 8L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.assignCourse(
                new AdminAcademicService.CourseAssignmentRequest(8L, 30L, 2L)));

        verify(classes, never()).findById(any());
        verify(enrollments, never()).insertIfAbsent(any(), any());
    }

    private static AcademicClass academicClassWithId(Long id) {
        AcademicClass academicClass = new AcademicClass(new Filiere("IT"), "Year 1");
        ReflectionTestUtils.setField(academicClass, "id", id);
        return academicClass;
    }
}
