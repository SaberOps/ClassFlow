package com.classflow.backendspringboot.academic;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.classflow.backendspringboot.config.MethodSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminAcademicController.class)
@Import(MethodSecurityConfig.class)
class AdminAcademicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminAcademicService service;

    @Test
    @WithMockUser(roles = "TEACHER")
    void nonAdminCannotAssignCoursesToClasses() throws Exception {
        mockMvc.perform(post("/api/admin/filieres/course-assignments").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"teacherId": 4, "courseId": 12, "classId": 8}
                                """))
                .andExpect(status().isForbidden());

        verifyNoInteractions(service);
    }
}
