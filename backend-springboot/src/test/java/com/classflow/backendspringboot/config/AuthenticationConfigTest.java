package com.classflow.backendspringboot.config;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import com.classflow.backendspringboot.user.auth.ClassFlowUserDetailsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationConfigTest {

    @Mock
    UserRepository users;

    @Test
    void authenticationManagerAcceptsMatchingPasswordAndRejectsIncorrectPassword() {
        AuthenticationConfig config = new AuthenticationConfig();
        PasswordEncoder passwordEncoder = config.passwordEncoder();
        User account = new User();
        account.setEmail("student@classflow.test");
        account.setPasswordHash(passwordEncoder.encode("correct-password"));
        account.setRole(Role.STUDENT);
        account.setEnabled(true);
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull("student@classflow.test"))
                .thenReturn(Optional.of(account));
        AuthenticationManager authenticationManager = config.authenticationManager(
                new ClassFlowUserDetailsService(users), passwordEncoder);

        Authentication authenticated = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        "student@classflow.test", "correct-password"));
        assertTrue(authenticated.isAuthenticated());

        assertThrows(BadCredentialsException.class, () -> authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        "student@classflow.test", "incorrect-password")));
    }
}
