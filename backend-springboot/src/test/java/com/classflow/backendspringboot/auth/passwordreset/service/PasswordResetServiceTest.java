package com.classflow.backendspringboot.auth.passwordreset.service;

import com.classflow.backendspringboot.auth.passwordreset.entity.PasswordResetToken;
import com.classflow.backendspringboot.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.classflow.backendspringboot.auth.passwordreset.repository.PasswordResetUserRepository;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private PasswordResetUserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository tokenRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private PasswordEncoder passwordEncoder;

    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(
                userRepository, tokenRepository, emailService, passwordEncoder, "http://localhost:4200/");
    }

    @Test
    void forgotPasswordDoesNotRevealUnknownAccounts() {
        when(userRepository.findByEmailIgnoreCaseAndEnabledTrueAndDeletedAtIsNull("unknown@example.com"))
                .thenReturn(Optional.empty());

        service.forgotPassword("unknown@example.com");

        verifyNoInteractions(tokenRepository, emailService);
    }

    @Test
    void forgotPasswordStoresOnlyTokenHashAndSendsResetLink() {
        User user = activeUser();
        when(userRepository.findByEmailIgnoreCaseAndEnabledTrueAndDeletedAtIsNull("user@example.com"))
                .thenReturn(Optional.of(user));
        when(tokenRepository.findByUserAndUsedFalse(user)).thenReturn(List.of());

        service.forgotPassword(" user@example.com ");

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        PasswordResetToken storedToken = tokenCaptor.getValue();
        assertTrue(storedToken.getTokenHash().matches("[0-9a-f]{64}"));
        assertTrue(storedToken.getExpiresAt().isAfter(Instant.now()));

        ArgumentCaptor<String> linkCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendResetEmail(org.mockito.ArgumentMatchers.eq(user.getEmail()), linkCaptor.capture());
        String resetLink = linkCaptor.getValue();
        assertTrue(resetLink.startsWith("http://localhost:4200/reset-password?token="));
        assertNotEquals(storedToken.getTokenHash(), resetLink.substring(resetLink.indexOf("token=") + 6));
    }

    @Test
    void resetPasswordEncodesPasswordAndConsumesToken() {
        User user = activeUser();
        user.setPasswordHash("old-hash");
        PasswordResetToken token = usableToken(user);
        when(tokenRepository.findByTokenHashAndUsedFalse(any())).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-password");

        service.resetPassword("raw-token", "new-password");

        assertEquals("encoded-password", user.getPasswordHash());
        assertTrue(token.isUsed());
        verify(userRepository).save(user);
        verify(tokenRepository).save(token);
    }

    @Test
    void resetPasswordRejectsExpiredToken() {
        PasswordResetToken token = usableToken(activeUser());
        token.setExpiresAt(Instant.now().minusSeconds(1));
        when(tokenRepository.findByTokenHashAndUsedFalse(any())).thenReturn(Optional.of(token));

        assertThrows(IllegalArgumentException.class, () -> service.resetPassword("raw-token", "new-password"));
        assertFalse(token.isUsed());
        verifyNoInteractions(passwordEncoder);
    }

    private static User activeUser() {
        User user = new User();
        user.setId(1L);
        user.setEmail("user@example.com");
        user.setPasswordHash("old-hash");
        user.setRole(Role.STUDENT);
        user.setEnabled(true);
        return user;
    }

    private static PasswordResetToken usableToken(User user) {
        PasswordResetToken token = new PasswordResetToken();
        token.setTokenHash("token-hash");
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(900));
        return token;
    }
}
