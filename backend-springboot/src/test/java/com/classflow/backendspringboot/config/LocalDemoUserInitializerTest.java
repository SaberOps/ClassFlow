package com.classflow.backendspringboot.config;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

class LocalDemoUserInitializerTest {

    private UserRepository users;
    private PasswordEncoder passwordEncoder;
    private LocalDemoUserInitializer initializer;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        initializer = new LocalDemoUserInitializer(users, passwordEncoder);
    }

    @Test
    void createsDemoAccountsWithEncodedPasswordsAndExpectedRoles() {
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "encoded:" + invocation.getArgument(0));
        when(users.save(org.mockito.ArgumentMatchers.any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        initializer.run(new DefaultApplicationArguments(new String[0]));

        verify(users).save(org.mockito.ArgumentMatchers.argThat(user ->
                user.getEmail().equals("admin@classflow.test")
                        && user.getRole() == Role.ADMIN
                        && user.getPasswordHash().equals("encoded:Admin123!")));
        verify(users).save(org.mockito.ArgumentMatchers.argThat(user ->
                user.getEmail().equals("student@classflow.test")
                        && user.getRole() == Role.STUDENT
                        && user.getPasswordHash().equals("encoded:Student123!")));
        verify(users).save(org.mockito.ArgumentMatchers.argThat(user ->
                user.getEmail().equals("teacher@classflow.test")
                        && user.getRole() == Role.TEACHER
                        && user.getPasswordHash().equals("encoded:Teacher123!")));
    }

    @Test
    void doesNotOverwriteAccountsThatAlreadyExist() {
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull(anyString()))
                .thenReturn(Optional.of(new User()));

        initializer.run(new DefaultApplicationArguments(new String[0]));

        verify(users, never()).save(org.mockito.ArgumentMatchers.any(User.class));
        verify(passwordEncoder, never()).encode(anyString());
    }
}
