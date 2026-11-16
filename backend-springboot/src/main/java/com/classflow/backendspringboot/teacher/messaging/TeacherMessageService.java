package com.classflow.backendspringboot.teacher.messaging;

import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.User;
import com.classflow.backendspringboot.user.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TeacherMessageService {
    private final JdbcTemplate jdbc;
    private final UserRepository users;

    public TeacherMessageService(JdbcTemplate jdbc,UserRepository users) {
        this.jdbc=jdbc;
        this.users=users;
    }

    public List<MessageDto> conversation(String email,long courseId,long studentId) {
        User teacher=teacher(email);
        requireConversation(teacher,courseId,studentId);
        jdbc.update("""
            UPDATE student_teacher_messages SET read_at=CURRENT_TIMESTAMP(6)
            WHERE course_id=? AND student_id=? AND teacher_id=? AND sender_id=? AND read_at IS NULL
            """,courseId,studentId,teacher.getId(),studentId);
        return jdbc.query("""
            SELECT m.id,m.course_id,m.sender_id,u.first_name,u.last_name,m.body,m.sent_at,m.read_at
            FROM student_teacher_messages m JOIN users u ON u.id=m.sender_id
            WHERE m.course_id=? AND m.student_id=? AND m.teacher_id=? ORDER BY m.sent_at,m.id
            """,(rs,row)->new MessageDto(rs.getLong("id"),rs.getLong("course_id"),rs.getLong("sender_id"),
                rs.getString("first_name")+" "+rs.getString("last_name"),rs.getString("body"),
                rs.getTimestamp("sent_at").toInstant(),rs.getTimestamp("read_at")==null?null:rs.getTimestamp("read_at").toInstant()),
            courseId,studentId,teacher.getId());
    }

    @Transactional
    public MessageDto reply(String email,long courseId,long studentId,String body) {
        User teacher=teacher(email);
        requireConversation(teacher,courseId,studentId);
        if(body==null || body.isBlank() || body.length()>4000) throw new IllegalArgumentException("Message must contain 1 to 4000 characters");
        jdbc.update("""
            INSERT INTO student_teacher_messages(course_id,student_id,teacher_id,sender_id,body)
            VALUES (?,?,?,?,?)
            """,courseId,studentId,teacher.getId(),teacher.getId(),body.trim());
        return jdbc.queryForObject("""
            SELECT m.id,m.course_id,m.sender_id,u.first_name,u.last_name,m.body,m.sent_at,m.read_at
            FROM student_teacher_messages m JOIN users u ON u.id=m.sender_id
            WHERE m.id=LAST_INSERT_ID()
            """,(rs,row)->new MessageDto(rs.getLong("id"),rs.getLong("course_id"),rs.getLong("sender_id"),
                rs.getString("first_name")+" "+rs.getString("last_name"),rs.getString("body"),
                rs.getTimestamp("sent_at").toInstant(),null));
    }

    private User teacher(String email) {
        User teacher=users.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
            .orElseThrow(()->new NotFoundException("Teacher account not found"));
        if(!teacher.isEnabled() || !"TEACHER".equals(teacher.getRole().name()))
            throw new NotFoundException("Teacher account not found");
        return teacher;
    }

    private void requireConversation(User teacher,long courseId,long studentId) {
        Integer count=jdbc.queryForObject("""
            SELECT COUNT(*) FROM courses c JOIN enrollments e ON e.course_id=c.id
            WHERE c.id=? AND c.teacher_id=? AND e.student_id=?
            """,Integer.class,courseId,teacher.getId(),studentId);
        if(count==null || count==0) throw new NotFoundException("Conversation not found");
    }

    public record MessageDto(long id,long courseId,long senderId,String senderName,String body,Instant sentAt,Instant readAt) {}
}
