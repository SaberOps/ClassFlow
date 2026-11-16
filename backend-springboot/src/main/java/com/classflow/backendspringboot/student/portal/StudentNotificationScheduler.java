package com.classflow.backendspringboot.student.portal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class StudentNotificationScheduler {
    private final JdbcTemplate jdbc;

    public StudentNotificationScheduler(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void publishStudentNotifications() {
        jdbc.update("""
            INSERT INTO notifications(user_id,type,title,body,link,reference_key,read_flag)
            SELECT e.student_id,'DEADLINE','Échéance proche',
                   CONCAT('Le devoir « ',a.title,' » arrive bientôt à échéance.'),
                   CONCAT('/student/assignments/',a.id),
                   CONCAT('assignment-due:',a.id,':',e.student_id),FALSE
            FROM assignments a
            JOIN enrollments e ON e.course_id=a.course_id
            WHERE a.due_at>CURRENT_TIMESTAMP(6)
              AND a.due_at<=DATE_ADD(CURRENT_TIMESTAMP(6),INTERVAL 24 HOUR)
            ON DUPLICATE KEY UPDATE reference_key=VALUES(reference_key)
            """);

        jdbc.update("""
            INSERT INTO notifications(user_id,type,title,body,link,reference_key,read_flag)
            SELECT u.id,'ANNOUNCEMENT','Nouvelle annonce',a.title,
                   '/student/feed',CONCAT('announcement:',a.id,':',u.id),FALSE
            FROM announcements a
            JOIN users u ON u.role='STUDENT' AND u.enabled=TRUE AND u.deleted_at IS NULL
            WHERE a.course_id IS NULL
              AND a.published_at>=DATE_SUB(CURRENT_TIMESTAMP(6),INTERVAL 10 MINUTE)
            UNION ALL
            SELECT e.student_id,'ANNOUNCEMENT','Nouvelle annonce',a.title,
                   '/student/feed',CONCAT('announcement:',a.id,':',e.student_id),FALSE
            FROM announcements a
            JOIN enrollments e ON e.course_id=a.course_id
            WHERE a.course_id IS NOT NULL
              AND a.published_at>=DATE_SUB(CURRENT_TIMESTAMP(6),INTERVAL 10 MINUTE)
            ON DUPLICATE KEY UPDATE reference_key=VALUES(reference_key)
            """);

        jdbc.update("""
            INSERT INTO notifications(user_id,type,title,body,link,reference_key,read_flag)
            SELECT e.student_id,'COURSE_CONTENT','Nouveau contenu de cours',r.title,
                   CONCAT('/student/courses/',r.course_id),
                   CONCAT('resource:',r.id,':',e.student_id),FALSE
            FROM resources r
            JOIN enrollments e ON e.course_id=r.course_id
            WHERE r.published_at>=DATE_SUB(CURRENT_TIMESTAMP(6),INTERVAL 10 MINUTE)
            ON DUPLICATE KEY UPDATE reference_key=VALUES(reference_key)
            """);

        jdbc.update("""
            INSERT INTO notifications(user_id,type,title,body,link,reference_key,read_flag)
            SELECT e.student_id,'TIMETABLE_CHANGE','Modification de séance',
                   CONCAT('La séance « ',COALESCE(t.title,c.title),' » a été modifiée.'),
                   '/student/timetable',CONCAT('session-change:',t.id,':',e.student_id),FALSE
            FROM timetable_sessions t
            JOIN courses c ON c.id=t.course_id
            JOIN enrollments e ON e.course_id=t.course_id
            WHERE t.last_minute_change=TRUE
              AND t.starts_at BETWEEN CURRENT_TIMESTAMP(6) AND DATE_ADD(CURRENT_TIMESTAMP(6),INTERVAL 48 HOUR)
            ON DUPLICATE KEY UPDATE reference_key=VALUES(reference_key)
            """);
    }
}
