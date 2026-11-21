package com.classflow.backendspringboot.student.portal;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class StudentPortalService {
    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final PasswordEncoder passwords;

    public StudentPortalService(JdbcTemplate jdbc, UserRepository users, PasswordEncoder passwords) {
        this.jdbc = jdbc;
        this.users = users;
        this.passwords = passwords;
    }

    public ProfileDto profile(User student) {
        List<String> courses = jdbc.query(
            "SELECT c.title FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.student_id=? AND c.active=TRUE ORDER BY c.title",
            (rs, row) -> rs.getString(1), student.getId());
        return jdbc.queryForObject("""
            SELECT u.id,u.first_name,u.last_name,u.email,sp.student_number, d.name AS department_name,
                   cg.name AS class_name,sp.phone,sp.photo_url
            FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id
            LEFT JOIN departments d ON d.id=sp.department_id
            LEFT JOIN class_groups cg ON cg.id=sp.class_group_id
            WHERE u.id=? AND u.deleted_at IS NULL
            """, (rs, row) -> new ProfileDto(rs.getLong("id"), rs.getString("first_name"),
                rs.getString("last_name"), rs.getString("email"), rs.getString("student_number"),
                rs.getString("department_name"), rs.getString("class_name"), rs.getString("phone"),
                rs.getString("photo_url"), courses), student.getId());
    }

    @Transactional
    public ProfileDto updateProfile(User student, ProfileUpdate request) {
        jdbc.update("""
            INSERT INTO student_profiles(user_id,phone,photo_url) VALUES (?,?,?)
            ON DUPLICATE KEY UPDATE phone=VALUES(phone), photo_url=VALUES(photo_url)
            """, student.getId(), request.phone(), request.photoUrl());
        return profile(student);
    }

    @Transactional
    public void changePassword(User student, PasswordUpdate request) {
        User managed = users.findById(student.getId())
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

    public List<NotificationDto> notifications(User student) {
        return jdbc.query("""
            SELECT id,type,title,body,link,read_flag,created_at
            FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC
            """, (rs, row) -> new NotificationDto(rs.getLong("id"), rs.getString("type"),
                rs.getString("title"), rs.getString("body"), rs.getString("link"),
                rs.getBoolean("read_flag"), rs.getTimestamp("created_at").toInstant()), student.getId());
    }

    public UnreadCount unreadCount(User student) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM notifications WHERE user_id=? AND read_flag=FALSE",
            Integer.class, student.getId());
        return new UnreadCount(count == null ? 0 : count);
    }

    @Transactional
    public void markRead(User student, long id) {
        int changed = jdbc.update("UPDATE notifications SET read_flag=TRUE WHERE id=? AND user_id=?", id, student.getId());
        if (changed == 0) throw new NotFoundException("Notification not found");
    }

    @Transactional
    public void markAllRead(User student) {
        jdbc.update("UPDATE notifications SET read_flag=TRUE WHERE user_id=? AND read_flag=FALSE", student.getId());
    }

    public List<FeedItem> feed(User student) {
        return jdbc.query("""
            SELECT a.id,
                   'ANNOUNCEMENT' AS type,
                   a.title,
                   a.body AS description,
                   COALESCE(c.title, 'ClassFlow') AS course_title,
                   a.published_at AS published_at,
                   CASE WHEN c.id IS NOT NULL THEN CONCAT('/student/courses/', c.id) ELSE '/student/feed' END AS link
            FROM announcements a
            LEFT JOIN courses c ON c.id = a.course_id
            LEFT JOIN student_profiles sp ON sp.user_id = ?
            LEFT JOIN class_groups cg ON cg.id = sp.class_group_id
            WHERE (
                    a.target_type = 'ALL'
                    OR (a.target_type = 'DEPARTMENT' AND cg.department_id = a.target_id)
                    OR (a.target_type = 'CLASS' AND cg.id = a.target_id)
                    OR (a.course_id IS NOT NULL AND a.course_id IN (
                        SELECT e.course_id FROM enrollments e WHERE e.student_id = ?
                    ))
                  )
            ORDER BY a.published_at DESC, a.id DESC
            """,
            (rs, rowNum) -> new FeedItem(
                    rs.getLong("id"),
                    rs.getString("type"),
                    rs.getString("title"),
                    rs.getString("description"),
                    rs.getString("course_title"),
                    rs.getTimestamp("published_at").toInstant(),
                    rs.getString("link")
            ), student.getId(), student.getId());
    }

    public List<RequestDocumentDto> requestDocuments() {
        return jdbc.query("""
            SELECT id,title,description,file_name,file_url,published_at
            FROM request_documents ORDER BY published_at DESC,id DESC
            """, (rs, row) -> new RequestDocumentDto(rs.getLong("id"), rs.getString("title"),
                rs.getString("description"), rs.getString("file_name"), rs.getString("file_url"),
                rs.getTimestamp("published_at").toInstant()));
    }

    public List<TeacherDto> teachers(User student) {
        return jdbc.query("""
            SELECT u.id,u.first_name,u.last_name,u.email,
                   GROUP_CONCAT(DISTINCT c.title ORDER BY c.title SEPARATOR '||') AS course_titles
            FROM enrollments e JOIN courses c ON c.id=e.course_id
            JOIN users u ON u.id=c.teacher_id
            WHERE e.student_id=? AND c.active=TRUE AND u.deleted_at IS NULL
            GROUP BY u.id,u.first_name,u.last_name,u.email
            ORDER BY u.last_name,u.first_name
            """, (rs, row) -> new TeacherDto(rs.getLong("id"), rs.getString("first_name"),
                rs.getString("last_name"), rs.getString("email"),
                rs.getString("course_titles") == null || rs.getString("course_titles").isBlank()
                    ? List.of() : Arrays.asList(rs.getString("course_titles").split("\\|\\|"))), student.getId());
    }

    public record ProfileDto(Long id, String firstName, String lastName, String email, String studentNumber,
                             String departmentName, String className, String phone, String photoUrl,
                             List<String> courseTitles) {}
    public record ProfileUpdate(String phone, String photoUrl) {}
    public record PasswordUpdate(String currentPassword, String newPassword) {}
    public record NotificationDto(Long id, String type, String title, String body, String link,
                                   boolean read, Instant createdAt) {}
    public record UnreadCount(int unread) {}
    public record FeedItem(Long id, String type, String title, String description, String courseTitle,
                          Instant date, String link) {}
    public record RequestDocumentDto(Long id, String title, String description, String fileName,
                                     String fileUrl, Instant publishedAt) {}
    public record TeacherDto(Long id, String firstName, String lastName, String email, List<String> courses) {}
}
