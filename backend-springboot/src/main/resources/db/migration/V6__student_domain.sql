CREATE TABLE IF NOT EXISTS departments (
                             id BIGINT NOT NULL AUTO_INCREMENT,
                             code VARCHAR(30) NOT NULL,
                             name VARCHAR(150) NOT NULL,
                             PRIMARY KEY (id),
                             CONSTRAINT uq_departments_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_groups (
                              id BIGINT NOT NULL AUTO_INCREMENT,
                              department_id BIGINT NOT NULL,
                              name VARCHAR(80) NOT NULL,
                              academic_year VARCHAR(20) NOT NULL,
                              PRIMARY KEY (id),
                              CONSTRAINT fk_class_groups_department FOREIGN KEY (department_id) REFERENCES departments(id),
                              CONSTRAINT uq_class_groups_name_year UNIQUE (name, academic_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_profiles (
                                  user_id BIGINT NOT NULL,
                                  department_id BIGINT NULL,
                                  class_group_id BIGINT NULL,
                                  student_number VARCHAR(40) NULL,
                                  phone VARCHAR(30) NULL,
                                  photo_url VARCHAR(500) NULL,
                                  PRIMARY KEY (user_id),
                                  CONSTRAINT fk_student_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                  CONSTRAINT fk_student_profiles_department FOREIGN KEY (department_id) REFERENCES departments(id),
                                  CONSTRAINT fk_student_profiles_class FOREIGN KEY (class_group_id) REFERENCES class_groups(id),
                                  CONSTRAINT uq_student_profiles_number UNIQUE (student_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
                         id BIGINT NOT NULL AUTO_INCREMENT,
                         code VARCHAR(30) NOT NULL,
                         title VARCHAR(200) NOT NULL,
                         description TEXT NULL,
                         objectives TEXT NULL,
                         teacher_id BIGINT NOT NULL,
                         class_group_id BIGINT NULL,
                         active BOOLEAN NOT NULL DEFAULT TRUE,
                         created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                         PRIMARY KEY (id),
                         CONSTRAINT uq_courses_code UNIQUE (code),
                         CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) REFERENCES users(id),
                         CONSTRAINT fk_courses_class FOREIGN KEY (class_group_id) REFERENCES class_groups(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
                             id BIGINT NOT NULL AUTO_INCREMENT,
                             course_id BIGINT NOT NULL,
                             student_id BIGINT NOT NULL,
                             enrolled_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                             PRIMARY KEY (id),
                             CONSTRAINT uq_enrollment UNIQUE (course_id, student_id),
                             CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                             CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                             INDEX idx_enrollment_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignments (
                             id BIGINT NOT NULL AUTO_INCREMENT,
                             course_id BIGINT NOT NULL,
                             title VARCHAR(200) NOT NULL,
                             instructions TEXT NULL,
                             due_at TIMESTAMP(6) NOT NULL,
                             allow_resubmit BOOLEAN NOT NULL DEFAULT TRUE,
                             max_score DECIMAL(6,2) NULL,
                             created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                             PRIMARY KEY (id),
                             CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_attachments (
                                        id BIGINT NOT NULL AUTO_INCREMENT,
                                        assignment_id BIGINT NOT NULL,
                                        file_name VARCHAR(255) NOT NULL,
                                        file_url VARCHAR(500) NOT NULL,
                                        content_type VARCHAR(120) NULL,
                                        PRIMARY KEY (id),
                                        CONSTRAINT fk_assignment_att FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submissions (
                             id BIGINT NOT NULL AUTO_INCREMENT,
                             assignment_id BIGINT NOT NULL,
                             student_id BIGINT NOT NULL,
                             submitted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                             file_name VARCHAR(255) NULL,
                             file_url VARCHAR(500) NULL,
                             comment TEXT NULL,
                             status VARCHAR(30) NOT NULL,
                             score DECIMAL(6,2) NULL,
                             teacher_feedback TEXT NULL,
                             graded_at TIMESTAMP(6) NULL,
                             PRIMARY KEY (id),
                             CONSTRAINT uq_submission UNIQUE (assignment_id, student_id),
                             CONSTRAINT fk_submission_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
                             CONSTRAINT fk_submission_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS timetable_sessions (
                                    id BIGINT NOT NULL AUTO_INCREMENT,
                                    course_id BIGINT NOT NULL,
                                    title VARCHAR(200) NULL,
                                    starts_at TIMESTAMP(6) NOT NULL,
                                    ends_at DATETIME(6) NOT NULL,
                                    room VARCHAR(80) NULL,
                                    meeting_url VARCHAR(500) NULL,
                                    cancelled BOOLEAN NOT NULL DEFAULT FALSE,
                                    last_minute_change BOOLEAN NOT NULL DEFAULT FALSE,
                                    change_note VARCHAR(500) NULL,
                                    PRIMARY KEY (id),
                                    CONSTRAINT fk_timetable_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                                    INDEX idx_timetable_starts (starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resources (
                           id BIGINT NOT NULL AUTO_INCREMENT,
                           course_id BIGINT NOT NULL,
                           title VARCHAR(200) NOT NULL,
                           resource_type VARCHAR(40) NOT NULL,
                           file_name VARCHAR(255) NOT NULL,
                           file_url VARCHAR(500) NOT NULL,
                           published_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                           PRIMARY KEY (id),
                           CONSTRAINT fk_resources_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_records (
                                    id BIGINT NOT NULL AUTO_INCREMENT,
                                    session_id BIGINT NOT NULL,
                                    student_id BIGINT NOT NULL,
                                    status VARCHAR(20) NOT NULL,
                                    remark VARCHAR(500) NULL,
                                    recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                                    PRIMARY KEY (id),
                                    CONSTRAINT uq_attendance UNIQUE (session_id, student_id),
                                    CONSTRAINT fk_attendance_session FOREIGN KEY (session_id) REFERENCES timetable_sessions(id) ON DELETE CASCADE,
                                    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
                               id BIGINT NOT NULL AUTO_INCREMENT,
                               course_id BIGINT NULL,
                               author_id BIGINT NOT NULL,
                               title VARCHAR(200) NOT NULL,
                               body TEXT NOT NULL,
                               category VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
                               published_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                               PRIMARY KEY (id),
                               CONSTRAINT fk_announcements_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                               CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
                               id BIGINT NOT NULL AUTO_INCREMENT,
                               user_id BIGINT NOT NULL,
                               type VARCHAR(40) NOT NULL,
                               title VARCHAR(200) NOT NULL,
                               body VARCHAR(1000) NULL,
                               link VARCHAR(500) NULL,
                               read_flag BOOLEAN NOT NULL DEFAULT FALSE,
                               created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                               PRIMARY KEY (id),
                               CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                               INDEX idx_notifications_user_read (user_id, read_flag, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_documents (
                                   id BIGINT NOT NULL AUTO_INCREMENT,
                                   title VARCHAR(200) NOT NULL,
                                   description TEXT NULL,
                                   file_name VARCHAR(255) NOT NULL,
                                   file_url VARCHAR(500) NOT NULL,
                                   published_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                                   PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;