package com.classflow.backendspringboot.user.admin;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.dto.UpdateUserRequest;
import com.classflow.backendspringboot.user.admin.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    AdminUserRepository repo;

    AdminUserService service;

    @BeforeEach
    void setUp() {
        service = new AdminUserService(repo, "");
    }

    private User user(long id, String email, Role role) {
        User u = new User();
        u.setId(id);
        u.setFirstName("First" + id);
        u.setLastName("Last" + id);
        u.setEmail(email);
        u.setRole(role);
        u.setEnabled(true);
        lenient().when(repo.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(u));
        return u;
    }

    @Test
    void updateChangesFields() {
        User u = user(1, "old@fst.utm.tn", Role.STUDENT);
        when(repo.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(anyString(), anyLong())).thenReturn(false);

        UserResponse r = service.update(1L, new UpdateUserRequest(" Ali ", "Ben", "New@FST.utm.tn"));

        assertEquals("Ali", u.getFirstName());
        assertEquals("new@fst.utm.tn", r.email());
    }

    @Test
    void updateRejectsEmailUsedByAnotherActiveAccount() {
        user(1, "a@fst.utm.tn", Role.STUDENT);
        when(repo.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot("b@fst.utm.tn", 1L)).thenReturn(true);

        assertThrows(ConflictException.class,
                () -> service.update(1L, new UpdateUserRequest("A", "B", "b@fst.utm.tn")));
    }

    @Test
    void updateRejectsEmailOutsideInstitutionalDomain() {
        service = new AdminUserService(repo, "fst.utm.tn");
        user(1, "a@fst.utm.tn", Role.STUDENT);

        assertThrows(ConflictException.class,
                () -> service.update(1L, new UpdateUserRequest("A", "B", "x@gmail.com")));
    }

    @Test
    void deactivateThenReactivate() {
        User u = user(2, "s@fst.utm.tn", Role.STUDENT);

        UserResponse off = service.setEnabled(2L, false, "admin@fst.utm.tn");
        assertFalse(off.enabled());
        assertNotNull(u.getDeactivatedAt());

        UserResponse on = service.setEnabled(2L, true, "admin@fst.utm.tn");
        assertTrue(on.enabled());
        assertNull(u.getDeactivatedAt());
    }

    @Test
    void adminCannotDeactivateOrDeleteOwnAccount() {
        user(3, "admin@fst.utm.tn", Role.ADMIN);

        assertThrows(ConflictException.class, () -> service.setEnabled(3L, false, "ADMIN@fst.utm.tn"));
        assertThrows(ConflictException.class, () -> service.delete(3L, "admin@fst.utm.tn"));
    }

    @Test
    void lastActiveAdminCannotBeRemoved() {
        user(4, "other-admin@fst.utm.tn", Role.ADMIN);
        when(repo.countByRoleAndEnabledTrueAndDeletedAtIsNull(Role.ADMIN)).thenReturn(1L);

        assertThrows(ConflictException.class, () -> service.setEnabled(4L, false, "me@fst.utm.tn"));
        assertThrows(ConflictException.class, () -> service.delete(4L, "me@fst.utm.tn"));
    }

    @Test
    void deleteIsSoftAndBlocksLogin() {
        User u = user(5, "t@fst.utm.tn", Role.TEACHER);

        service.delete(5L, "admin@fst.utm.tn");

        assertNotNull(u.getDeletedAt());
        assertFalse(u.isEnabled());
    }

    @Test
    void unknownOrDeletedAccountIsNotFound() {
        when(repo.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.get(99L));
        assertThrows(NotFoundException.class, () -> service.delete(99L, "admin@fst.utm.tn"));
    }
}
