package com.classflow.backendspringboot.common;

import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class CurrentTeacher {

    private final UserRepository users;

    public CurrentTeacher(UserRepository users) {
        this.users = users;
    }

    public User require(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Not authenticated");
        }
        User user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(authentication.getName())
                .orElseThrow(() -> new NotFoundException("Account not found"));
        if (user.getRole() != Role.TEACHER) {
            throw new AccessDeniedException("Teacher role required");
        }
        return user;
    }
}
