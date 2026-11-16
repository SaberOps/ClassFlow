package com.classflow.backendspringboot.student.extended;

import com.classflow.backendspringboot.academic.enrollment.EnrollmentRepository;
import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class StudentExtendedService {
    private final JdbcTemplate jdbc;
    private final EnrollmentRepository enrollments;

    public StudentExtendedService(JdbcTemplate jdbc, EnrollmentRepository enrollments) {
        this.jdbc = jdbc;
        this.enrollments = enrollments;
    }

    public List<MessageDto> messages(User student, long courseId) {
        requireEnrollment(student, courseId);
        jdbc.update("""
            UPDATE student_teacher_messages SET read_at=CURRENT_TIMESTAMP(6)
            WHERE course_id=? AND student_id=? AND sender_id<>? AND read_at IS NULL
            """, courseId, student.getId(), student.getId());
        return jdbc.query("""
            SELECT m.id,m.course_id,m.student_id,m.teacher_id,m.sender_id,u.first_name,u.last_name,
                   m.body,m.sent_at,m.read_at
            FROM student_teacher_messages m JOIN users u ON u.id=m.sender_id
            WHERE m.course_id=? AND m.student_id=? ORDER BY m.sent_at,m.id
            """, (rs,row) -> new MessageDto(rs.getLong("id"),rs.getLong("course_id"),
                rs.getLong("sender_id"),rs.getString("first_name")+" "+rs.getString("last_name"),
                rs.getString("body"),rs.getTimestamp("sent_at").toInstant(),
                rs.getTimestamp("read_at")==null?null:rs.getTimestamp("read_at").toInstant()),
            courseId,student.getId());
    }

    @Transactional
    public MessageDto sendMessage(User student, MessageRequest request) {
        requireEnrollment(student, request.courseId());
        Long teacherId = jdbc.queryForObject(
            "SELECT teacher_id FROM courses WHERE id=? AND active=TRUE", Long.class, request.courseId());
        if (request.body()==null || request.body().isBlank() || request.body().length()>4000) {
            throw new ConflictException("Message must contain between 1 and 4000 characters");
        }
        jdbc.update("""
            INSERT INTO student_teacher_messages(course_id,student_id,teacher_id,sender_id,body)
            VALUES (?,?,?,?,?)
            """,request.courseId(),student.getId(),teacherId,student.getId(),request.body().trim());
        return jdbc.queryForObject("""
            SELECT m.id,m.course_id,m.sender_id,u.first_name,u.last_name,m.body,m.sent_at,m.read_at
            FROM student_teacher_messages m JOIN users u ON u.id=m.sender_id
            WHERE m.id=LAST_INSERT_ID()
            """,(rs,row)->new MessageDto(rs.getLong("id"),rs.getLong("course_id"),rs.getLong("sender_id"),
                rs.getString("first_name")+" "+rs.getString("last_name"),rs.getString("body"),
                rs.getTimestamp("sent_at").toInstant(),null));
    }

    public List<JustificationDto> justifications(User student) {
        return jdbc.query("""
            SELECT j.id,j.attendance_record_id,j.file_name,j.file_url,j.comment,j.status,j.submitted_at,
                   ar.status AS attendance_status,ts.starts_at,c.title AS course_title
            FROM attendance_justifications j
            JOIN attendance_records ar ON ar.id=j.attendance_record_id
            JOIN timetable_sessions ts ON ts.id=ar.session_id
            JOIN courses c ON c.id=ts.course_id
            WHERE j.student_id=? ORDER BY j.submitted_at DESC
            """,(rs,row)->new JustificationDto(rs.getLong("id"),rs.getLong("attendance_record_id"),
                rs.getString("file_name"),rs.getString("file_url"),rs.getString("comment"),
                rs.getString("status"),rs.getTimestamp("submitted_at").toInstant(),
                rs.getString("attendance_status"),rs.getTimestamp("starts_at").toInstant(),
                rs.getString("course_title")),student.getId());
    }

    @Transactional
    public JustificationDto submitJustification(User student, JustificationRequest request) {
        Integer count=jdbc.queryForObject(
            "SELECT COUNT(*) FROM attendance_records WHERE id=? AND student_id=? AND status='ABSENT'",
            Integer.class,request.attendanceRecordId(),student.getId());
        if(count==null || count==0) throw new NotFoundException("Absence record not found");
        Integer existing=jdbc.queryForObject(
            "SELECT COUNT(*) FROM attendance_justifications WHERE attendance_record_id=? AND student_id=?",
            Integer.class,request.attendanceRecordId(),student.getId());
        if(existing!=null && existing>0) throw new ConflictException("A justification has already been submitted");
        if(request.fileName()==null || request.fileName().isBlank() || request.fileUrl()==null || request.fileUrl().isBlank()) {
            throw new ConflictException("A supporting document is required");
        }
        jdbc.update("""
            INSERT INTO attendance_justifications(attendance_record_id,student_id,file_name,file_url,comment)
            VALUES (?,?,?,?,?)
            """,request.attendanceRecordId(),student.getId(),request.fileName(),request.fileUrl(),request.comment());
        return jdbc.queryForObject("""
            SELECT id,attendance_record_id,file_name,file_url,comment,status,submitted_at
            FROM attendance_justifications WHERE id=LAST_INSERT_ID()
            """,(rs,row)->new JustificationDto(rs.getLong("id"),rs.getLong("attendance_record_id"),
                rs.getString("file_name"),rs.getString("file_url"),rs.getString("comment"),
                rs.getString("status"),rs.getTimestamp("submitted_at").toInstant(),
                "ABSENT",null,""),request.attendanceRecordId());
    }

    public List<FeedItemDto> feed(User student) {
        List<FeedItemDto> items=new ArrayList<>();
        jdbc.query("""
            SELECT a.id,a.title,a.body,a.category,a.published_at,a.course_id,c.title AS course_title
            FROM announcements a LEFT JOIN courses c ON c.id=a.course_id
            WHERE a.course_id IS NULL OR EXISTS
              (SELECT 1 FROM enrollments e WHERE e.course_id=a.course_id AND e.student_id=?)
            """,(rs)->items.add(new FeedItemDto("ANNOUNCEMENT",rs.getLong("id"),rs.getString("title"),
                rs.getString("body"),rs.getString("course_title"),rs.getTimestamp("published_at").toInstant(),
                "/student/notifications")),student.getId());
        jdbc.query("""
            SELECT t.id,COALESCE(t.title,c.title) AS title,t.room,t.starts_at,c.title AS course_title
            FROM timetable_sessions t JOIN courses c ON c.id=t.course_id
            JOIN enrollments e ON e.course_id=c.id
            WHERE e.student_id=? AND t.cancelled=FALSE AND t.starts_at>=CURRENT_TIMESTAMP(6)
            """,(rs)->items.add(new FeedItemDto("SESSION",rs.getLong("id"),rs.getString("title"),
                rs.getString("room"),rs.getString("course_title"),rs.getTimestamp("starts_at").toInstant(),
                "/student/timetable")),student.getId());
        jdbc.query("""
            SELECT a.id,a.title,a.instructions,a.due_at,c.title AS course_title
            FROM assignments a JOIN courses c ON c.id=a.course_id
            JOIN enrollments e ON e.course_id=c.id
            WHERE e.student_id=? AND a.due_at>=CURRENT_TIMESTAMP(6)
            """,(rs)->items.add(new FeedItemDto("ASSIGNMENT",rs.getLong("id"),rs.getString("title"),
                rs.getString("instructions"),rs.getString("course_title"),rs.getTimestamp("due_at").toInstant(),
                "/student/assignments")),student.getId());
        return items.stream().sorted(Comparator.comparing(FeedItemDto::date).reversed()).limit(50).toList();
    }

    private void requireEnrollment(User student,long courseId) {
        if(!enrollments.existsByCourseIdAndStudentId(courseId,student.getId()))
            throw new NotFoundException("Course not found");
    }

    public record MessageRequest(long courseId,String body) {}
    public record MessageDto(long id,long courseId,long senderId,String senderName,String body,Instant sentAt,Instant readAt) {}
    public record JustificationRequest(long attendanceRecordId,String fileName,String fileUrl,String comment) {}
    public record JustificationDto(long id,long attendanceRecordId,String fileName,String fileUrl,String comment,
                                   String status,Instant submittedAt,String attendanceStatus,Instant absenceAt,String courseTitle) {}
    public record FeedItemDto(String type,long id,String title,String description,String courseTitle,Instant date,String link) {}
}
