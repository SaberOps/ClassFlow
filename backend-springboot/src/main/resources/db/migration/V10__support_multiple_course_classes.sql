CREATE TABLE course_class_assignments (
    course_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    PRIMARY KEY (course_id, class_id),
    CONSTRAINT fk_course_class_assignment_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_class_assignment_class
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_course_class_assignment_class (class_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO course_class_assignments (course_id, class_id)
SELECT id, academic_class_id
FROM courses
WHERE academic_class_id IS NOT NULL;

ALTER TABLE courses
    DROP FOREIGN KEY fk_courses_academic_class,
    DROP COLUMN academic_class_id;
