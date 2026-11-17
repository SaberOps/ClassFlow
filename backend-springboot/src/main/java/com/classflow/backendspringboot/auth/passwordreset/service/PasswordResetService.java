package com.classflow.backendspringboot.auth.passwordreset.service;

import com.classflow.backendspringboot.auth.passwordreset.entity.PasswordResetToken;
import com.classflow.backendspringboot.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.classflow.backendspringboot.auth.passwordreset.repository.PasswordResetUserRepository;
import com.classflow.backendspringboot.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class PasswordResetService {

    private static final Duration TOKEN_LIFETIME = Duration.ofMinutes(15);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PasswordResetUserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final String frontendUrl;

    public PasswordResetService(
            PasswordResetUserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            @Value("${app.frontend-url:http://localhost:4200}") String frontendUrl) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public void forgotPassword(String email) {
        var userOptional = userRepository.findByEmailIgnoreCaseAndEnabledTrueAndDeletedAtIsNull(email.trim());
        if (userOptional.isEmpty()) {
            return;
        }

        User user = userOptional.get();
        var unusedTokens = tokenRepository.findByUserAndUsedFalse(user);
        unusedTokens.forEach(PasswordResetToken::markAsUsed);
        tokenRepository.saveAll(unusedTokens);

        String token = generateToken();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setTokenHash(hashToken(token));
        resetToken.setUser(user);
        resetToken.setExpiresAt(Instant.now().plus(TOKEN_LIFETIME));
        tokenRepository.save(resetToken);

        String resetLink = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + token;
        emailService.sendResetEmail(user.getEmail(), resetLink);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByTokenHashAndUsedFalse(hashToken(token))
                .filter(candidate -> !candidate.isExpired(Instant.now()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset link"));

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.markAsUsed();
        tokenRepository.save(resetToken);
    }

    private static String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hashToken(String token) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
