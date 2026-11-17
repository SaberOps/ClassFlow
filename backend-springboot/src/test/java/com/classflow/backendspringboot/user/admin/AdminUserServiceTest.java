package com.classflow.backendspringboot.user.admin;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.portal.StudentPortalService;
import com.classflow.backendspringboot.teacher.portal.TeacherPortalService;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.dto.AdminUserProfileResponse;
import com.classflow.backendspringboot.user.admin.dto.TemporaryPasswordResponse;
import com.classflow.backendspringboot.user.admin.dto.UpdateUserRequest;
import com.classflow.backendspringboot.user.admin.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    AdminUserRepository repo;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    StudentPortalService studentPortal;

    @Mock
    TeacherPortalService teacherPortal;

    AdminUserService service;

    @BeforeEach
    void setUp() {
        service = new AdminUserService(repo, "", passwordEncoder, studentPortal, teacherPortal);
    }

    private User user(long id, String email, Role role) {
        User u = new User();
        u.setId(id);
        u.setFirstName("First" + id);
        u.setLastName("Last" + id);
        u.setEmail(email);
        u.setRole(role);
        u.setEnabled(true);
        lenient().when(repo.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(u));
        return u;
    }

    @Test
    void updateChangesFields() {
        User u = user(1, "old@fst.utm.tn", Role.STUDENT);
        when(repo.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(anyString(), anyLong())).thenReturn(false);

        UserResponse r = service.update(1L, new UpdateUserRequest(" Ali ", "Ben", "New@FST.utm.tn"));

        assertEquals("Ali", u.getFirstName());
        assertEquals("new@fst.utm.tn", r.email());
    }

    @Test
    void updateRejectsEmailUsedByAnotherActiveAccount() {
        user(1, "a@fst.utm.tn", Role.STUDENT);
        when(repo.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot("b@fst.utm.tn", 1L)).thenReturn(true);

        assertThrows(ConflictException.class,
                () -> service.update(1L, new UpdateUserRequest("A", "B", "b@fst.utm.tn")));
    }

    @Test
    void updateRejectsEmailOutsideInstitutionalDomain() {
        service = new AdminUserService(repo, "fst.utm.tn", passwordEncoder, studentPortal, teacherPortal);
        user(1, "a@fst.utm.tn", Role.STUDENT);

        assertThrows(ConflictException.class,
                () -> service.update(1L, new UpdateUserRequest("A", "B", "x@gmail.com")));
    }

    @Test
    void deactivateThenReactivate() {
        User u = user(2, "s@fst.utm.tn", Role.STUDENT);

        UserResponse off = service.setEnabled(2L, false, "admin@fst.utm.tn");
        assertFalse(off.enabled());
        assertNotNull(u.getDeactivatedAt());

        UserResponse on = service.setEnabled(2L, true, "admin@fst.utm.tn");
        assertTrue(on.enabled());
        assertNull(u.getDeactivatedAt());
    }

    @Test
    void adminCannotDeactivateOrDeleteOwnAccount() {
        user(3, "admin@fst.utm.tn", Role.ADMIN);

        assertThrows(ConflictException.class, () -> service.setEnabled(3L, false, "ADMIN@fst.utm.tn"));
        assertThrows(ConflictException.class, () -> service.delete(3L, "admin@fst.utm.tn"));
    }

    @Test
    void lastActiveAdminCannotBeRemoved() {
        user(4, "other-admin@fst.utm.tn", Role.ADMIN);
        when(repo.countByRoleAndEnabledTrueAndDeletedAtIsNull(Role.ADMIN)).thenReturn(1L);

        assertThrows(ConflictException.class, () -> service.setEnabled(4L, false, "me@fst.utm.tn"));
        assertThrows(ConflictException.class, () -> service.delete(4L, "me@fst.utm.tn"));
    }

    @Test
    void deleteIsSoftAndBlocksLogin() {
        User u = user(5, "t@fst.utm.tn", Role.TEACHER);

        service.delete(5L, "admin@fst.utm.tn");

        assertNotNull(u.getDeletedAt());
        assertFalse(u.isEnabled());
    }

    @Test
    void unknownOrDeletedAccountIsNotFound() {
        when(repo.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.get(99L));
        assertThrows(NotFoundException.class, () -> service.delete(99L, "admin@fst.utm.tn"));
    }

    @Test
    void profileLoadsStudentAcademicAndContactDetails() {
        User student = user(6, "student@fst.utm.tn", Role.STUDENT);
        when(studentPortal.profile(student)).thenReturn(new StudentPortalService.ProfileDto(
                6L, "First6", "Last6", student.getEmail(), "ST-6", "Sciences", "L1",
                "+216 12345678", "https://example.test/photo.jpg", List.of("Math")));

        AdminUserProfileResponse profile = service.getProfile(6L);

        assertEquals("ST-6", profile.studentNumber());
        assertEquals("Sciences", profile.departmentName());
        assertEquals("L1", profile.className());
        assertEquals(List.of("Math"), profile.courses());
        assertEquals("+216 12345678", profile.phone());
        assertFalse(profile.mustChangePassword());
    }

    @Test
    void profileLoadsTeacherSubjectsAndContactDetails() {
        User teacher = user(9, "teacher@fst.utm.tn", Role.TEACHER);
        when(teacherPortal.profile(teacher)).thenReturn(new TeacherPortalService.ProfileDto(
                9L, "First9", "Last9", teacher.getEmail(), "+216 12345678",
                "https://example.test/teacher.jpg", List.of("Physics")));

        AdminUserProfileResponse profile = service.getProfile(9L);

        assertEquals(List.of("Physics"), profile.subjects());
        assertEquals("+216 12345678", profile.phone());
        assertEquals("https://example.test/teacher.jpg", profile.photoUrl());
    }

    @Test
    void temporaryPasswordResetHashesPasswordAndRequiresChangeAtNextLogin() {
        User student = user(7, "student@fst.utm.tn", Role.STUDENT);
        student.setPasswordHash("old-hash");
        student.setFailedLoginAttempts(5);
        student.setLockedUntil(Instant.now().plusSeconds(60));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hash");
        when(repo.save(student)).thenReturn(student);

        TemporaryPasswordResponse response = service.resetTemporaryPassword(7L);

        assertEquals(student.getEmail(), response.email());
        assertEquals(16, response.temporaryPassword().length());
        assertTrue(response.temporaryPassword().chars().anyMatch(Character::isUpperCase));
        assertTrue(response.temporaryPassword().chars().anyMatch(Character::isLowerCase));
        assertTrue(response.temporaryPassword().chars().anyMatch(Character::isDigit));
        assertTrue(response.mustChangePassword());
        assertEquals("new-hash", student.getPasswordHash());
        assertTrue(student.isMustChangePassword());
        assertEquals(0, student.getFailedLoginAttempts());
        assertNull(student.getLockedUntil());
        verify(passwordEncoder).encode(response.temporaryPassword());
    }

    @Test
    void temporaryPasswordResetIsAvailableForTeachers() {
        User teacher = user(10, "teacher@fst.utm.tn", Role.TEACHER);
        when(passwordEncoder.encode(anyString())).thenReturn("teacher-hash");

        TemporaryPasswordResponse response = service.resetTemporaryPassword(10L);

        assertEquals(teacher.getEmail(), response.email());
        assertTrue(teacher.isMustChangePassword());
        assertEquals("teacher-hash", teacher.getPasswordHash());
    }

    @Test
    void temporaryPasswordResetRejectsAdministrators() {
        user(8, "admin@fst.utm.tn", Role.ADMIN);

        assertThrows(ConflictException.class, () -> service.resetTemporaryPassword(8L));

        verify(passwordEncoder, never()).encode(anyString());
        verify(repo, never()).save(org.mockito.ArgumentMatchers.any(User.class));
    }
}
