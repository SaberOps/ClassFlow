package com.classflow.backendspringboot.user.auth;

import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MustChangePasswordFilterTest {
    @AfterEach
    void clearContext() { SecurityContextHolder.clearContext(); }

    @Test
    void blocksTeacherApisUntilTemporaryPasswordIsChanged() throws Exception {
        UserRepository users = mock(UserRepository.class);
        User account = new User();
        account.setMustChangePassword(true);
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull("teacher@classflow.test"))
                .thenReturn(Optional.of(account));
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(
                        "teacher@classflow.test", null, List.of(() -> "ROLE_TEACHER")));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/teacher/courses");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        new MustChangePasswordFilter(users).doFilter(request, response, (req, res) -> continued.set(true));

        assertEquals(428, response.getStatus());
        assertFalse(continued.get());
    }

    @Test
    void permitsThePasswordChangeEndpointAndLogoutWhilePasswordChangeIsRequired() throws Exception {
        UserRepository users = mock(UserRepository.class);
        User account = new User();
        account.setMustChangePassword(true);
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull("teacher@classflow.test"))
                .thenReturn(Optional.of(account));
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(
                        "teacher@classflow.test", null, List.of(() -> "ROLE_TEACHER")));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/teacher/profile/password");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        new MustChangePasswordFilter(users).doFilter(request, response, (req, res) -> continued.set(true));

        assertEquals(200, response.getStatus());
        assertTrue(continued.get());
        verifyNoInteractions(users);
    }
}
