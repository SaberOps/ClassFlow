package com.classflow.backendspringboot.user.auth;

import com.classflow.backendspringboot.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class MustChangePasswordFilter extends OncePerRequestFilter {
    private final UserRepository users;

    public MustChangePasswordFilter(UserRepository users) {
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean passwordChangeAllowed = request.getRequestURI().equals("/api/auth/me")
                || request.getRequestURI().equals("/api/auth/logout")
                || request.getRequestURI().equals("/api/auth/csrf")
                || (request.getMethod().equals("POST")
                    && (request.getRequestURI().equals("/api/teacher/profile/password")
                        || request.getRequestURI().equals("/api/student/profile/password")));
        if (passwordChangeAllowed || !request.getRequestURI().startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean required = users.findByEmailIgnoreCaseAndDeletedAtIsNull(authentication.getName())
                .map(user -> user.isMustChangePassword())
                .orElse(false);
        if (required) {
            response.setStatus(428);
            response.setContentType("application/json");
            response.getWriter().write("{\"detail\":\"Change your temporary password before continuing\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
