package com.classflow.backendspringboot.user.auth;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.auth.dto.AuthResponse;
import com.classflow.backendspringboot.user.auth.dto.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationControllerTest {

    @Mock
    AuthenticationManager authenticationManager;

    @Mock
    SecurityContextRepository securityContextRepository;

    @Mock
    SessionAuthenticationStrategy sessionAuthenticationStrategy;

    private AuthenticationController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthenticationController(
                authenticationManager, securityContextRepository, sessionAuthenticationStrategy);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void loginSavesAuthenticatedContextInSessionAndReturnsSafeAccountDetails() {
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                "admin@classflow.test",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        HttpServletRequest request = new MockHttpServletRequest();
        HttpServletResponse response = new MockHttpServletResponse();

        AuthResponse result = controller.login(
                new LoginRequest("admin@classflow.test", "password"), request, response);

        assertEquals(new AuthResponse("admin@classflow.test", Role.ADMIN), result);
        verify(sessionAuthenticationStrategy).onAuthentication(same(authentication), same(request), same(response));
        verify(securityContextRepository).saveContext(any(SecurityContext.class), same(request), same(response));
        assertEquals(authentication, SecurityContextHolder.getContext().getAuthentication());
    }
}
