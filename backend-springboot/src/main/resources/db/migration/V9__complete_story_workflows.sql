ALTER TABLE users
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN locked_until TIMESTAMP(6) NULL,
    ADD COLUMN phone VARCHAR(30) NULL,
    ADD COLUMN photo_url VARCHAR(500) NULL;

CREATE TABLE login_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NULL,
    attempted_email VARCHAR(255) NOT NULL,
    succeeded BOOLEAN NOT NULL,
    attempted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_login_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_login_attempts_email_time (attempted_email, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teacher_class_assignments (
    teacher_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    PRIMARY KEY (teacher_id, class_id),
    CONSTRAINT fk_teacher_class_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_class_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE courses
    ADD COLUMN academic_class_id BIGINT NULL,
    ADD CONSTRAINT fk_courses_academic_class FOREIGN KEY (academic_class_id) REFERENCES classes(id);

ALTER TABLE resources
    MODIFY COLUMN file_name VARCHAR(255) NULL,
    MODIFY COLUMN file_url VARCHAR(500) NULL,
    ADD COLUMN content_text TEXT NULL,
    ADD COLUMN external_url VARCHAR(1000) NULL,
    ADD COLUMN content_type VARCHAR(120) NULL,
    ADD COLUMN updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);

ALTER TABLE announcements
    ADD COLUMN target_type VARCHAR(20) NOT NULL DEFAULT 'ALL',
    ADD COLUMN target_id BIGINT NULL;

ALTER TABLE timetable_sessions
    ADD COLUMN class_id BIGINT NULL,
    ADD COLUMN teacher_id BIGINT NULL,
    ADD CONSTRAINT fk_timetable_class FOREIGN KEY (class_id) REFERENCES classes(id),
    ADD CONSTRAINT fk_timetable_teacher FOREIGN KEY (teacher_id) REFERENCES users(id);

CREATE INDEX idx_timetable_room_time ON timetable_sessions(room, starts_at, ends_at);
CREATE INDEX idx_timetable_class_time ON timetable_sessions(class_id, starts_at, ends_at);
CREATE INDEX idx_timetable_teacher_time ON timetable_sessions(teacher_id, starts_at, ends_at);

CREATE TABLE uploaded_files (
    id BIGINT NOT NULL AUTO_INCREMENT,
    owner_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    extension VARCHAR(10) NOT NULL,
    content_type VARCHAR(120) NULL,
    content LONGBLOB NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_uploaded_file_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE uploaded_file_access (
    file_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (file_id,user_id),
    CONSTRAINT fk_file_access_file FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE,
    CONSTRAINT fk_file_access_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
