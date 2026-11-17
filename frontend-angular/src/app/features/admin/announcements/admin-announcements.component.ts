package com.classflow.backendspringboot.admin.announcement;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
public class AdminAnnouncementService {
    private final JdbcTemplate jdbc;

    public AdminAnnouncementService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<AnnouncementSummary> list() {
        return jdbc.query("""
                SELECT a.id, a.title, a.body, a.target_type, a.target_id, a.course_id,
                       CONCAT(u.first_name, ' ', u.last_name) AS author_name, a.published_at
                FROM announcements a
                JOIN users u ON u.id = a.author_id
                ORDER BY a.published_at DESC, a.id DESC
                """,
                (rs, rowNum) -> new AnnouncementSummary(
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getString("body"),
                        rs.getString("target_type"),
                        (Long) rs.getObject("target_id"),
                        (Long) rs.getObject("course_id"),
                        rs.getString("author_name"),
                        rs.getTimestamp("published_at").toInstant()
                ));
    }

    @Transactional
    public AnnouncementSummary create(User admin, AdminAnnouncementController.AnnouncementRequest request) {
        String targetType = request.targetType() == null ? "ALL" : request.targetType().trim().toUpperCase();
        if (targetType.equals("DEPARTMENT") || targetType.equals("CLASS")) {
            if (request.targetId() == null) {
                throw new ConflictException("A target id is required for this announcement type");
            }
        } else if (!"ALL".equals(targetType)) {
            throw new ConflictException("Invalid target type");
        }

        String trimmedTitle = request.title().trim();
        String trimmedBody = request.body().trim();
        if (trimmedTitle.isEmpty() || trimmedBody.isEmpty()) {
            throw new ConflictException("Title and body are required");
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO announcements (course_id, author_id, title, body, category, published_at, target_type, target_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS);
            ps.setNull(1, java.sql.Types.BIGINT);
            ps.setLong(2, admin.getId());
            ps.setString(3, trimmedTitle);
            ps.setString(4, trimmedBody);
            ps.setString(5, "GENERAL");
            ps.setTimestamp(6, Timestamp.from(Instant.now()));
            ps.setString(7, targetType);
            if (request.targetId() == null) {
                ps.setNull(8, java.sql.Types.BIGINT);
            } else {
                ps.setLong(8, request.targetId());
            }
            return ps;
        }, keyHolder);

        Long id = Objects.requireNonNull(keyHolder.getKey()).longValue();
        notifyRecipients(targetType, request.targetId());
        return new AnnouncementSummary(id, trimmedTitle, trimmedBody, targetType, request.targetId(), null,
                admin.getFirstName() + " " + admin.getLastName(), Instant.now());
    }

    private void notifyRecipients(String targetType, Long targetId) {
        String sql = """
                INSERT INTO notifications (user_id, type, title, body, link, read_flag, created_at)
                SELECT u.id, 'NEW_ANNOUNCEMENT', a.title, a.body, '/student/feed', FALSE, NOW(6)
                FROM users u
                LEFT JOIN student_profiles sp ON sp.user_id = u.id
                LEFT JOIN class_groups cg ON cg.id = sp.class_group_id
                JOIN announcements a ON a.id = (SELECT MAX(id) FROM announcements)
                WHERE u.deleted_at IS NULL
                  AND u.enabled = TRUE
                  AND u.role = 'STUDENT'
                  AND (
                        a.target_type = 'ALL'
                        OR (a.target_type = 'DEPARTMENT' AND cg.department_id = a.target_id)
                        OR (a.target_type = 'CLASS' AND cg.id = a.target_id)
                  )
                """;

        jdbc.update(sql);
    }

    public record AnnouncementSummary(
            Long id,
            String title,
            String body,
            String targetType,
            Long targetId,
            Long courseId,
            String authorName,
            Instant publishedAt) {}
}
