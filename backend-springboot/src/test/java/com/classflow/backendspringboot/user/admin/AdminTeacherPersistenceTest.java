
package com.classflow.backendspringboot.user.admin;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.dto.CreateTeacherRequest;
import com.classflow.backendspringboot.user.admin.dto.TeacherCreatedResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AdminTeacherPersistenceTest {

    @Autowired
    private AdminTeacherService service;

    @Autowired
    private AdminUserRepository repository;

    @Test
    void createTeacherPersistsDataInMySQL() {

        String email = "teacher-" + UUID.randomUUID()
                + "@fst.utm.tn";

        CreateTeacherRequest request = new CreateTeacherRequest(
                "Ali",
                "Ben Salah",
                email,
                Set.of("Java", "SQL")
        );

        TeacherCreatedResponse response = service.create(request);

        User saved = repository
                .findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow();

        assertEquals(response.id(), saved.getId());
        assertEquals(Role.TEACHER, saved.getRole());
        assertEquals(Set.of("Java", "SQL"), saved.getSubjects());
        assertTrue(saved.isMustChangePassword());
        assertNotEquals(
                response.temporaryPassword(),
                saved.getPasswordHash()
        );
    }
}
