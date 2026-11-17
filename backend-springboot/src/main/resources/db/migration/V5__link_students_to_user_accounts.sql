ALTER TABLE students
    ADD COLUMN national_id VARCHAR(40) NULL,
    ADD COLUMN user_id BIGINT NULL,
    ADD CONSTRAINT uq_students_national_id UNIQUE (national_id),
    ADD CONSTRAINT uq_students_user_id UNIQUE (user_id),
    ADD CONSTRAINT fk_students_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL;
