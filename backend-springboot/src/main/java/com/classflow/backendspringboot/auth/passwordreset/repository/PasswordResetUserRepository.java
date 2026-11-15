package com.classflow.backendspringboot.auth.passwordreset.repository;

import com.classflow.backendspringboot.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetUserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCaseAndEnabledTrueAndDeletedAtIsNull(String email);
}
