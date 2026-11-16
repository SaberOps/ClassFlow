
ALTER TABLE users
ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE teacher_subjects (
    teacher_id BIGINT NOT NULL,
    subject_name VARCHAR(120) NOT NULL,

    PRIMARY KEY (teacher_id, subject_name),

    CONSTRAINT fk_teacher_subjects_user
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
