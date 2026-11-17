package com.classflow.backendspringboot.common;

import com.classflow.backendspringboot.common.exception.ConflictException;
import com.classflow.backendspringboot.common.exception.NotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;

@Service
public class FileStorageService {
    public static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED = Set.of("pdf", "docx", "pptx", "jpg", "png");
    private final JdbcTemplate jdbc;

    public FileStorageService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public StoredFile store(MultipartFile file, long ownerId) {
        String name = file.getOriginalFilename();
        if (file.isEmpty() || file.getSize() > MAX_BYTES || name == null || name.isBlank()) {
            throw new ConflictException("File must be non-empty and no larger than 10 MiB");
        }
        name = name.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1);
        int dot = name.lastIndexOf('.');
        if (dot <= 0 || !ALLOWED.contains(name.substring(dot + 1).toLowerCase(Locale.ROOT))) {
            throw new ConflictException("Only PDF, DOCX, PPTX, JPG, and PNG files are allowed");
        }
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException ex) {
            throw new ConflictException("Unable to read uploaded file");
        }
        String extension = name.substring(dot + 1).toLowerCase(Locale.ROOT);
        jdbc.update("INSERT INTO uploaded_files(owner_id,file_name,extension,content_type,content) VALUES (?,?,?,?,?)",
                ownerId, name, extension, file.getContentType(), content);
        Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return new StoredFile(id, name, file.getContentType(), "/api/files/" + id);
    }

    @Transactional(readOnly = true)
    public FileDownload load(long id, String email, boolean admin) {
        return jdbc.query("""
                SELECT f.file_name,f.content_type,f.content
                FROM uploaded_files f LEFT JOIN users u ON LOWER(u.email)=LOWER(?)
                LEFT JOIN uploaded_file_access a ON a.file_id=f.id AND a.user_id=u.id
                WHERE f.id=? AND (f.owner_id=u.id OR a.user_id=u.id OR ?=TRUE
                    OR (u.role='STUDENT' AND u.enabled=TRUE AND u.deleted_at IS NULL AND (
                        EXISTS (SELECT 1 FROM resources r JOIN enrollments e ON e.course_id=r.course_id
                                WHERE r.file_url=CONCAT('/api/files/',f.id) AND e.student_id=u.id)
                        OR EXISTS (SELECT 1 FROM assignment_attachments aa
                                   JOIN assignments ass ON ass.id=aa.assignment_id
                                   JOIN enrollments e ON e.course_id=ass.course_id
                                   WHERE aa.file_url=CONCAT('/api/files/',f.id) AND e.student_id=u.id)
                        OR EXISTS (SELECT 1 FROM request_documents d
                                   WHERE d.file_url=CONCAT('/api/files/',f.id))
                    ))
                    OR (u.role='TEACHER' AND u.enabled=TRUE AND u.deleted_at IS NULL AND EXISTS (
                        SELECT 1 FROM submissions s JOIN assignments ass ON ass.id=s.assignment_id
                        JOIN courses c ON c.id=ass.course_id
                        WHERE s.file_url=CONCAT('/api/files/',f.id) AND c.teacher_id=u.id))
                )
                """, rs -> rs.next()
                ? new FileDownload(rs.getString(1), rs.getString(2), rs.getBytes(3))
                : throwNotFound(), email, id, admin);
    }

    @Transactional(readOnly = true)
    public boolean isOwnedBy(long fileId, long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM uploaded_files WHERE id=? AND owner_id=?",
                Integer.class, fileId, userId);
        return count != null && count > 0;
    }

    private FileDownload throwNotFound() {
        throw new NotFoundException("File not found");
    }

    public record StoredFile(Long id, String fileName, String contentType, String url) {}
    public record FileDownload(String fileName, String contentType, byte[] content) {}
}
