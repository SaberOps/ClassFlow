
package com.classflow.backendspringboot.user.admin;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.dto.CreateTeacherRequest;
import com.classflow.backendspringboot.user.admin.dto.TeacherCreatedResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminTeacherServiceTest {

    @Mock
    AdminUserRepository repo;

    AdminTeacherService service;

    @BeforeEach
    void setUp() {
        service = new AdminTeacherService(repo, "");
    }

    @Test
    void createTeacherSuccessfully() {
        when(repo.findByEmailIgnoreCaseAndDeletedAtIsNull(
                "ali@fst.utm.tn"
        )).thenReturn(Optional.empty());

        when(repo.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        CreateTeacherRequest request = new CreateTeacherRequest(
                " Ali ",
                " Ben Salah ",
                "ALI@FST.UTM.TN",
                Set.of("Java", "SQL")
        );

        TeacherCreatedResponse response = service.create(request);

        assertEquals(1L, response.id());
        assertEquals("Ali", response.firstName());
        assertEquals("Ben Salah", response.lastName());
        assertEquals("ali@fst.utm.tn", response.email());
        assertEquals(Role.TEACHER, response.role());
        assertEquals(Set.of("Java", "SQL"), response.subjects());
        assertEquals(16, response.temporaryPassword().length());
        assertTrue(response.mustChangePassword());

        verify(repo).save(any(User.class));
    }

    @Test
    void createTeacherRejectsDuplicateEmail() {
        User existing = new User();

        when(repo.findByEmailIgnoreCaseAndDeletedAtIsNull(
                "ali@fst.utm.tn"
        )).thenReturn(Optional.of(existing));

        CreateTeacherRequest request = new CreateTeacherRequest(
                "Ali",
                "Ben Salah",
                "ali@fst.utm.tn",
                Set.of("Java")
        );

        assertThrows(
                ConflictException.class,
                () -> service.create(request)
        );

        verify(repo, never()).save(any(User.class));
    }

    @Test
    void createTeacherRejectsEmailOutsideInstitutionalDomain() {
        service = new AdminTeacherService(repo, "fst.utm.tn");

        CreateTeacherRequest request = new CreateTeacherRequest(
                "Ali",
                "Ben Salah",
                "ali@gmail.com",
                Set.of("Java")
        );

        assertThrows(
                ConflictException.class,
                () -> service.create(request)
        );

        verify(repo, never()).save(any(User.class));
    }

    @Test
    void createTeacherRejectsEmptyValidSubjects() {
        when(repo.findByEmailIgnoreCaseAndDeletedAtIsNull(
                "ali@fst.utm.tn"
        )).thenReturn(Optional.empty());

        CreateTeacherRequest request = new CreateTeacherRequest(
                "Ali",
                "Ben Salah",
                "ali@fst.utm.tn",
                Set.of(" ", "  ")
        );

        assertThrows(
                ConflictException.class,
                () -> service.create(request)
        );

        verify(repo, never()).save(any(User.class));
    }
}
