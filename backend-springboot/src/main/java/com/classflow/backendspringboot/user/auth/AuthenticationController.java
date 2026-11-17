package com.classflow.backendspringboot.user.auth;

import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import com.classflow.backendspringboot.user.auth.dto.AuthResponse;
import com.classflow.backendspringboot.user.auth.dto.LoginRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final SessionAuthenticationStrategy sessionAuthenticationStrategy;
    private final UserRepository users;
    private final JdbcTemplate jdbc;

    public AuthenticationController(
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            SessionAuthenticationStrategy sessionAuthenticationStrategy,
            UserRepository users,
            JdbcTemplate jdbc) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.sessionAuthenticationStrategy = sessionAuthenticationStrategy;
        this.users = users;
        this.jdbc = jdbc;
    }

    @GetMapping("/csrf")
    public CsrfToken csrfToken(CsrfToken csrfToken) {
        return csrfToken;
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.email().trim(), request.password()));
        } catch (AuthenticationException ex) {
            recordFailure(request.email());
            throw ex;
        }

        User user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(authentication.getName()).orElse(null);
        if (user != null && (user.getFailedLoginAttempts() != 0 || user.getLockedUntil() != null)) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            users.save(user);
        }
        if (user != null) {
            jdbc.update("INSERT INTO login_attempts(user_id,attempted_email,succeeded) VALUES (?,?,TRUE)",
                    user.getId(), user.getEmail());
        }

        sessionAuthenticationStrategy.onAuthentication(authentication, servletRequest, servletResponse);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, servletRequest, servletResponse);

        return toResponse(authentication);
    }

    @GetMapping("/me")
    public AuthResponse currentUser(Authentication authentication) {
        return toResponse(authentication);
    }

    private AuthResponse toResponse(Authentication authentication) {
        User user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated account not found"));
        return new AuthResponse(user.getEmail(), user.getRole(), user.isMustChangePassword());
    }

    @Transactional
    void recordFailure(String email) {
        User user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(email.trim()).orElse(null);
        if (user != null) {
            Instant now = Instant.now();
            if (!user.isLoginLocked(now)) {
                if (user.getLockedUntil() != null && !user.getLockedUntil().isAfter(now)) {
                user.setFailedLoginAttempts(0);
                user.setLockedUntil(null);
                }
                int failed = user.getFailedLoginAttempts() + 1;
                user.setFailedLoginAttempts(failed);
                if (failed >= 5) user.setLockedUntil(now.plusSeconds(15 * 60));
                users.save(user);
            }
        }
        jdbc.update("INSERT INTO login_attempts(user_id,attempted_email,succeeded) VALUES (?,?,FALSE)",
                user == null ? null : user.getId(), email.trim());
    }
}
