
package com.classflow.backendspringboot.user.admin;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.dto.CreateTeacherRequest;
import com.classflow.backendspringboot.user.admin.dto.TeacherCreatedResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminTeacherService {

    private final AdminUserRepository users;
    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();
    private final String institutionalDomain;

    public AdminTeacherService(
            AdminUserRepository users,
            @Value("${classflow.institutional-email-domain:}") String institutionalDomain) {
        this.users = users;
        this.institutionalDomain = institutionalDomain == null
                ? ""
                : institutionalDomain.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public TeacherCreatedResponse create(CreateTeacherRequest request) {

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (!institutionalDomain.isEmpty()
                && !email.endsWith("@" + institutionalDomain)) {
            throw new ConflictException(
                    "The email must belong to the institutional domain @" + institutionalDomain
            );
        }

        if (users.findByEmailIgnoreCaseAndDeletedAtIsNull(email).isPresent()) {
            throw new ConflictException("This email is already used by another account");
        }

        Set<String> subjects = request.subjects().stream()
                .map(String::trim)
                .filter(subject -> !subject.isEmpty())
                .collect(Collectors.toSet());

        if (subjects.isEmpty()) {
            throw new ConflictException("At least one valid subject is required");
        }

        String temporaryPassword = TemporaryPasswordGenerator.generate();

        User teacher = new User();
        teacher.setFirstName(request.firstName().trim());
        teacher.setLastName(request.lastName().trim());
        teacher.setEmail(email);
        teacher.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        teacher.setRole(Role.TEACHER);
        teacher.setEnabled(true);
        teacher.setMustChangePassword(true);
        teacher.setSubjects(subjects);

        User savedTeacher = users.save(teacher);

        return new TeacherCreatedResponse(
                savedTeacher.getId(),
                savedTeacher.getFirstName(),
                savedTeacher.getLastName(),
                savedTeacher.getEmail(),
                savedTeacher.getRole(),
                savedTeacher.getSubjects(),
                temporaryPassword,
                savedTeacher.isMustChangePassword()
        );
    }

}
