package com.classflow.backendspringboot.student.portal;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import com.classflow.backendspringboot.student.portal.StudentPortalService.PasswordUpdate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentPortalServiceTest {

    @Mock
    JdbcTemplate jdbc;

    @Mock
    UserRepository users;

    @Mock
    PasswordEncoder passwords;

    private StudentPortalService service;

    @BeforeEach
    void setUp() {
        service = new StudentPortalService(jdbc, users, passwords);
    }

    @Test
    void changingTemporaryPasswordClearsMustChangeFlag() {
        User student = student();
        when(users.findById(1L)).thenReturn(Optional.of(student));
        when(passwords.matches("Temporary123!", "old-hash")).thenReturn(true);
        when(passwords.encode("NewPassword1")).thenReturn("new-hash");
        when(users.save(student)).thenReturn(student);

        service.changePassword(student, new PasswordUpdate("Temporary123!", "NewPassword1"));

        assertFalse(student.isMustChangePassword());
        verify(users).save(student);
    }

    @Test
    void changingTemporaryPasswordRejectsWeakPassword() {
        User student = student();
        when(users.findById(1L)).thenReturn(Optional.of(student));
        when(passwords.matches("Temporary123!", "old-hash")).thenReturn(true);

        assertThrows(ConflictException.class,
                () -> service.changePassword(student, new PasswordUpdate("Temporary123!", "weakpassword")));

        assertTrue(student.isMustChangePassword());
        verify(passwords, never()).encode("weakpassword");
    }

    private static User student() {
        User student = new User();
        student.setId(1L);
        student.setRole(Role.STUDENT);
        student.setPasswordHash("old-hash");
        student.setMustChangePassword(true);
        return student;
    }
}
