package com.classflow.backendspringboot.user.admin;


import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.admin.dto.TeacherCreatedResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminTeacherController.class)
@Import(com.classflow.backendspringboot.config.MethodSecurityConfig.class)
class AdminTeacherControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminTeacherService service;

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanCreateTeacher() throws Exception {

        when(service.create(any())).thenReturn(
                new TeacherCreatedResponse(
                        1L,
                        "Ali",
                        "Ben Salah",
                        "ali@fst.utm.tn",
                        Role.TEACHER,
                        Set.of("Java", "SQL"),
                        "Temp123456789!",
                        true
                )
        );

        mockMvc.perform(post("/api/admin/teachers").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Ali",
                                  "lastName": "Ben Salah",
                                  "email": "ali@fst.utm.tn",
                                  "subjects": ["Java", "SQL"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.role").value("TEACHER"))
                .andExpect(jsonPath("$.mustChangePassword").value(true));

        verify(service).create(any());
    }

    @Test
    @WithMockUser(roles = "USER")
    void normalUserCannotCreateTeacher() throws Exception {

        mockMvc.perform(post("/api/admin/teachers").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Ali",
                                  "lastName": "Ben Salah",
                                  "email": "ali@fst.utm.tn",
                                  "subjects": ["Java"]
                                }
                                """))
                .andExpect(status().isForbidden());

        verifyNoInteractions(service);
    }

    @Test
    void unauthenticatedUserCannotCreateTeacher() throws Exception {

        mockMvc.perform(post("/api/admin/teachers").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Ali",
                                  "lastName": "Ben Salah",
                                  "email": "ali@fst.utm.tn",
                                  "subjects": ["Java"]
                                }
                                """))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(service);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void invalidRequestIsRejected() throws Exception {

        mockMvc.perform(post("/api/admin/teachers").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "",
                                  "lastName": "Ben Salah",
                                  "email": "invalid-email",
                                  "subjects": []
                                }
                                """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }
}
