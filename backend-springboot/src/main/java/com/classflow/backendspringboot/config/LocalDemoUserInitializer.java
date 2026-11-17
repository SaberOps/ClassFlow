package com.classflow.backendspringboot.config;

import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Profile("local")
public class LocalDemoUserInitializer implements ApplicationRunner {

    private static final List<DemoUser> DEMO_USERS = List.of(
            new DemoUser("Demo", "Admin", "admin@classflow.test", "Admin123!", Role.ADMIN),
            new DemoUser("Demo", "Student", "student@classflow.test", "Student123!", Role.STUDENT),
            new DemoUser("Demo", "Teacher", "teacher@classflow.test", "Teacher123!", Role.TEACHER)
    );

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public LocalDemoUserInitializer(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (DemoUser demoUser : DEMO_USERS) {
            if (users.findByEmailIgnoreCaseAndDeletedAtIsNull(demoUser.email()).isPresent()) {
                continue;
            }

            User user = new User();
            user.setFirstName(demoUser.firstName());
            user.setLastName(demoUser.lastName());
            user.setEmail(demoUser.email());
            user.setPasswordHash(passwordEncoder.encode(demoUser.password()));
            user.setRole(demoUser.role());
            users.save(user);
        }
    }

    private record DemoUser(String firstName, String lastName, String email, String password, Role role) {
    }
}
