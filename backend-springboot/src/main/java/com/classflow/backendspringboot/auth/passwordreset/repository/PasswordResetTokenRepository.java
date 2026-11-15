package com.classflow.backendspringboot.auth.passwordreset.repository;

import com.classflow.backendspringboot.auth.passwordreset.entity.PasswordResetToken;
import com.classflow.backendspringboot.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHashAndUsedFalse(String tokenHash);

    List<PasswordResetToken> findByUserAndUsedFalse(User user);
}
