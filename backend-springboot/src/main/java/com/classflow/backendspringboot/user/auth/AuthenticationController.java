package com.classflow.backendspringboot.user.auth;

import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import com.classflow.backendspringboot.user.auth.dto.AuthResponse;
import com.classflow.backendspringboot.user.auth.dto.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.Instant;

@Controller
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final SessionAuthenticationStrategy sessionAuthenticationStrategy;
    private final UserRepository users;
    private final JdbcTemplate jdbc;
    private final int maxLoginAttempts;
    private final long loginLockDurationSeconds;

    public AuthenticationController(
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            SessionAuthenticationStrategy sessionAuthenticationStrategy,
            UserRepository users,
            JdbcTemplate jdbc,
            @Value("${classflow.max-login-attempts:5}") int maxLoginAttempts,
            @Value("${classflow.login-lock-duration-seconds:900}") long loginLockDurationSeconds) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.sessionAuthenticationStrategy = sessionAuthenticationStrategy;
        this.users = users;
        this.jdbc = jdbc;
        this.maxLoginAttempts = maxLoginAttempts;
        this.loginLockDurationSeconds = loginLockDurationSeconds;
    }

    @GetMapping("/csrf")
    @ResponseBody
    public Object csrfToken() {
        return null;
    }

    @PostMapping("/login")
    @ResponseBody
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
        if (user != null) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            users.save(user);
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
    @ResponseBody
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
        if (user == null) {
            jdbc.update("INSERT INTO login_attempts(user_id,attempted_email,succeeded) VALUES (?,?,FALSE)",
                    null, email.trim());
            return;
        }

        Instant now = Instant.now();
        if (user.isLoginLocked(now)) {
            return;
        }

        int failed = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(failed);

        if (failed >= maxLoginAttempts) {
            user.setLockedUntil(now.plusSeconds(loginLockDurationSeconds));
        }

        users.save(user);
        jdbc.update("INSERT INTO login_attempts(user_id,attempted_email,succeeded) VALUES (?,?,FALSE)",
                user.getId(), email.trim());
    }
}
