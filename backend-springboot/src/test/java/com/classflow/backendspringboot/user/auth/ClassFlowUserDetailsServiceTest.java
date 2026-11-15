package com.classflow.backendspringboot.user.auth;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassFlowUserDetailsServiceTest {

    @Mock
    UserRepository users;

    private ClassFlowUserDetailsService service;

    @BeforeEach
    void setUp() {
        service = new ClassFlowUserDetailsService(users);
    }

    @Test
    void loadsUserWithStoredPasswordAndRoleAuthority() {
        User account = new User();
        account.setEmail("admin@classflow.test");
        account.setPasswordHash("{bcrypt}stored-hash");
        account.setRole(Role.ADMIN);
        account.setEnabled(true);
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull("ADMIN@classflow.test"))
                .thenReturn(Optional.of(account));

        UserDetails details = service.loadUserByUsername("ADMIN@classflow.test");

        assertEquals("admin@classflow.test", details.getUsername());
        assertEquals("{bcrypt}stored-hash", details.getPassword());
        assertTrue(details.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")));
        assertTrue(details.isEnabled());
    }

    @Test
    void deactivatedAccountIsDisabled() {
        User account = new User();
        account.setEmail("teacher@classflow.test");
        account.setPasswordHash("{bcrypt}stored-hash");
        account.setRole(Role.TEACHER);
        account.setEnabled(true);
        account.setDeactivatedAt(Instant.now());
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull("teacher@classflow.test"))
                .thenReturn(Optional.of(account));

        assertFalse(service.loadUserByUsername("teacher@classflow.test").isEnabled());
    }

    @Test
    void missingOrSoftDeletedAccountIsNotFound() {
        when(users.findByEmailIgnoreCaseAndDeletedAtIsNull("missing@classflow.test"))
                .thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> service.loadUserByUsername("missing@classflow.test"));
    }
}
