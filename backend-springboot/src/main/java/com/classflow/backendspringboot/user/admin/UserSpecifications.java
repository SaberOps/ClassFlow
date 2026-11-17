package com.classflow.backendspringboot.user.admin;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

final class UserSpecifications {

    private UserSpecifications() {
    }

    static Specification<User> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    static Specification<User> hasRole(Role role) {
        return (root, query, cb) -> cb.equal(root.get("role"), role);
    }

    static Specification<User> isEnabled(boolean enabled) {
        return (root, query, cb) -> cb.equal(root.get("enabled"), enabled);
    }

    /** Case-insensitive search on first name, last name and email. */
    static Specification<User> matches(String text) {
        String like = "%" + text.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("firstName")), like),
                cb.like(cb.lower(root.get("lastName")), like),
                cb.like(cb.lower(root.get("email")), like));
    }
}
