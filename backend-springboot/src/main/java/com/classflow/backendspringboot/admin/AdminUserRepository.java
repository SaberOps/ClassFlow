package com.classflow.backendspringboot.user.admin;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

/**
 * Separate from the teammates' UserRepository on purpose (avoids merge conflicts in parallel Scrum work).
 * Every method excludes soft-deleted accounts.
 */
public interface AdminUserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByIdAndDeletedAtIsNull(Long id);

    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    boolean existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(String email, Long id);

    long countByRoleAndEnabledTrueAndDeletedAtIsNull(Role role);
}
