package com.classflow.backendspringboot.user.admin;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.student.portal.StudentPortalService;
import com.classflow.backendspringboot.teacher.portal.TeacherPortalService;
import com.classflow.backendspringboot.user.Role;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.admin.dto.AdminUserProfileResponse;
import com.classflow.backendspringboot.user.admin.dto.PageResponse;
import com.classflow.backendspringboot.user.admin.dto.TemporaryPasswordResponse;
import com.classflow.backendspringboot.user.admin.dto.UpdateUserRequest;
import com.classflow.backendspringboot.user.admin.dto.UserResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

/**
 * Administration account-management operations.
 *
 * Rules:
 *  - deactivate = reversible, login blocked, all history kept
 *  - delete     = soft delete (deleted_at), history kept, account disappears and cannot log in
 *  - nobody can deactivate/delete their own account
 *  - the last active admin cannot be deactivated/deleted
 */
@Service
public class AdminUserService {

    private static final int MAX_PAGE_SIZE = 100;

    private final AdminUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final StudentPortalService studentPortal;
    private final TeacherPortalService teacherPortal;
    private final String institutionalDomain;

    public AdminUserService(
            AdminUserRepository users,
            @Value("${classflow.institutional-email-domain:}") String institutionalDomain,
            PasswordEncoder passwordEncoder,
            StudentPortalService studentPortal,
            TeacherPortalService teacherPortal) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.studentPortal = studentPortal;
        this.teacherPortal = teacherPortal;
        this.institutionalDomain = institutionalDomain == null ? "" : institutionalDomain.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(Role role, Boolean enabled, String q, int page, int size) {
        Specification<User> spec = UserSpecifications.notDeleted();
        if (role != null) {
            spec = spec.and(UserSpecifications.hasRole(role));
        }
        if (enabled != null) {
            spec = spec.and(UserSpecifications.isEnabled(enabled));
        }
        if (q != null && !q.isBlank()) {
            spec = spec.and(UserSpecifications.matches(q));
        }
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        var pageable = PageRequest.of(Math.max(page, 0), safeSize,
                Sort.by("lastName").ascending().and(Sort.by("firstName").ascending()));
        return PageResponse.of(users.findAll(spec, pageable), AdminUserService::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return toResponse(findActive(id));
    }

    @Transactional(readOnly = true)
    public AdminUserProfileResponse getProfile(Long id) {
        User user = findActive(id);
        if (user.getRole() == Role.STUDENT) {
            StudentPortalService.ProfileDto profile = studentPortal.profile(user);
            return new AdminUserProfileResponse(
                    user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole(),
                    user.isEnabled(), user.getDeactivatedAt(), profile.phone(), profile.photoUrl(),
                    profile.studentNumber(), profile.departmentName(), profile.className(),
                    List.of(), profile.courseTitles(), user.isMustChangePassword());
        }
        if (user.getRole() == Role.TEACHER) {
            TeacherPortalService.ProfileDto profile = teacherPortal.profile(user);
            return new AdminUserProfileResponse(
                    user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole(),
                    user.isEnabled(), user.getDeactivatedAt(), profile.phone(), profile.photoUrl(),
                    null, null, null, profile.subjects(), List.of(), user.isMustChangePassword());
        }
        return new AdminUserProfileResponse(
                user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole(),
                user.isEnabled(), user.getDeactivatedAt(), user.getPhone(), user.getPhotoUrl(),
                null, null, null, List.of(), List.of(), user.isMustChangePassword());
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = findActive(id);
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (!institutionalDomain.isEmpty() && !email.endsWith("@" + institutionalDomain)) {
            throw new ConflictException("The email must belong to the institutional domain @" + institutionalDomain);
        }
        if (users.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(email, id)) {
            throw new ConflictException("This email is already used by another account");
        }

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        return toResponse(user);
    }

    @Transactional
    public UserResponse setEnabled(Long id, boolean enabled, String currentAdminEmail) {
        User user = findActive(id);
        if (!enabled) {
            guardSelfAndLastAdmin(user, currentAdminEmail, "deactivate");
        }
        user.setEnabled(enabled);
        user.setDeactivatedAt(enabled ? null : Instant.now());
        return toResponse(user);
    }

    @Transactional
    public TemporaryPasswordResponse resetTemporaryPassword(Long id) {
        User user = findActive(id);
        if (user.getRole() == Role.ADMIN) {
            throw new ConflictException("Temporary password reset is only available for student and teacher accounts");
        }

        String temporaryPassword = TemporaryPasswordGenerator.generate();
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setMustChangePassword(true);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        users.save(user);

        return new TemporaryPasswordResponse(user.getId(), user.getEmail(), temporaryPassword, true);
    }

    @Transactional
    public void delete(Long id, String currentAdminEmail) {
        User user = findActive(id);
        guardSelfAndLastAdmin(user, currentAdminEmail, "delete");
        // TODO (when the Course entity exists): if the user is a TEACHER who still has courses,
        // throw new ConflictException("Reassign or remove this teacher's courses first");
        user.setEnabled(false);
        user.setDeletedAt(Instant.now());
    }

    private void guardSelfAndLastAdmin(User target, String currentAdminEmail, String action) {
        if (currentAdminEmail != null && currentAdminEmail.equalsIgnoreCase(target.getEmail())) {
            throw new ConflictException("You cannot " + action + " your own account");
        }
        if (target.getRole() == Role.ADMIN && target.isEnabled()
                && users.countByRoleAndEnabledTrueAndDeletedAtIsNull(Role.ADMIN) <= 1) {
            throw new ConflictException("You cannot " + action + " the last active administrator");
        }
    }

    private User findActive(Long id) {
        return users.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new NotFoundException("Account not found"));
    }

    static UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                u.getRole(), u.isEnabled(), u.getDeactivatedAt());
    }
}
