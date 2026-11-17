package com.classflow.backendspringboot.teacher.portal;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;

@Service
@Transactional(readOnly = true)
public class TeacherPortalService {
    private static final Pattern PHONE = Pattern.compile("^\\+?[0-9 ()-]{7,20}$");

    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final PasswordEncoder passwords;

    public TeacherPortalService(JdbcTemplate jdbc, UserRepository users, PasswordEncoder passwords) {
        this.jdbc = jdbc;
        this.users = users;
        this.passwords = passwords;
    }

    public ProfileDto profile(User teacher) {
        List<String> subjects = jdbc.query(
                "SELECT subject_name FROM teacher_subjects WHERE teacher_id=? ORDER BY subject_name",
                (rs, row) -> rs.getString(1), teacher.getId());
        return new ProfileDto(teacher.getId(), teacher.getFirstName(), teacher.getLastName(),
                teacher.getEmail(), teacher.getPhone(), teacher.getPhotoUrl(), subjects);
    }

    @Transactional
    public ProfileDto updateProfile(User teacher, ProfileUpdate request) {
        if (StringUtils.hasText(request.phone()) && !PHONE.matcher(request.phone().trim()).matches()) {
            throw new ConflictException("Phone number format is invalid");
        }
        if (StringUtils.hasText(request.photoUrl()) && !isWebUrl(request.photoUrl())) {
            throw new ConflictException("Photo must use an http(s) URL");
        }
        User managed = users.findById(teacher.getId())
                .orElseThrow(() -> new NotFoundException("Account not found"));
        managed.setPhone(blankToNull(request.phone()));
        managed.setPhotoUrl(blankToNull(request.photoUrl()));
        users.save(managed);
        teacher.setPhone(managed.getPhone());
        teacher.setPhotoUrl(managed.getPhotoUrl());
        return profile(teacher);
    }

    @Transactional
    public void changePassword(User teacher, PasswordUpdate request) {
        User managed = users.findById(teacher.getId())
                .orElseThrow(() -> new NotFoundException("Account not found"));
        if (!passwords.matches(request.currentPassword(), managed.getPasswordHash())) {
            throw new ConflictException("Current password is incorrect");
        }
        if (request.newPassword() == null || request.newPassword().length() < 10
                || request.newPassword().length() > 72
                || request.newPassword().chars().noneMatch(Character::isUpperCase)
                || request.newPassword().chars().noneMatch(Character::isLowerCase)
                || request.newPassword().chars().noneMatch(Character::isDigit)) {
            throw new ConflictException("Password must be 10–72 characters and include upper, lower, and numeric characters");
        }
        managed.setPasswordHash(passwords.encode(request.newPassword()));
        managed.setMustChangePassword(false);
        users.save(managed);
    }

    public List<NotificationDto> notifications(User teacher) {
        return jdbc.query("""
                SELECT id,type,title,body,link,read_flag,created_at
                FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC
                """, (rs, row) -> new NotificationDto(rs.getLong("id"), rs.getString("type"),
                rs.getString("title"), rs.getString("body"), rs.getString("link"),
                rs.getBoolean("read_flag"), rs.getTimestamp("created_at").toInstant()), teacher.getId());
    }

    public UnreadCount unreadCount(User teacher) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE user_id=? AND read_flag=FALSE",
                Integer.class, teacher.getId());
        return new UnreadCount(count == null ? 0 : count);
    }

    @Transactional
    public void markRead(User teacher, long id) {
        if (jdbc.update("UPDATE notifications SET read_flag=TRUE WHERE id=? AND user_id=?", id,
                teacher.getId()) == 0) {
            throw new NotFoundException("Notification not found");
        }
    }

    @Transactional
    public void markAllRead(User teacher) {
        jdbc.update("UPDATE notifications SET read_flag=TRUE WHERE user_id=? AND read_flag=FALSE",
                teacher.getId());
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static boolean isWebUrl(String value) {
        if (value.length() > 500) return false;
        try {
            URI uri = URI.create(value.trim());
            return uri.isAbsolute() && uri.getHost() != null
                    && ("http".equalsIgnoreCase(uri.getScheme())
                    || "https".equalsIgnoreCase(uri.getScheme()));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    public record ProfileDto(Long id, String firstName, String lastName, String email,
                             String phone, String photoUrl, List<String> subjects) {}
    public record ProfileUpdate(String phone, String photoUrl) {}
    public record PasswordUpdate(String currentPassword, String newPassword) {}
    public record NotificationDto(Long id, String type, String title, String body,
                                  String link, boolean read, Instant createdAt) {}
    public record UnreadCount(int unread) {}
}
