ALTER TABLE notifications
    ADD COLUMN reference_key VARCHAR(120) NULL,
    ADD UNIQUE INDEX uq_notifications_user_reference (user_id, reference_key);

CREATE TABLE student_teacher_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    read_at TIMESTAMP(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_messages_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_teacher FOREIGN KEY (teacher_id) REFERENCES users(id),
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id),
    INDEX idx_messages_conversation (course_id, student_id, teacher_id, sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_justifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    attendance_record_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    comment VARCHAR(1000) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reviewed_at TIMESTAMP(6) NULL,
    reviewed_by BIGINT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_attendance_justification UNIQUE (attendance_record_id, student_id),
    CONSTRAINT fk_justification_attendance FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_justification_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_justification_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_justification_student_status (student_id, status, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
