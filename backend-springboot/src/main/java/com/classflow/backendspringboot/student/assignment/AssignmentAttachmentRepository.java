package com.classflow.backendspringboot.student.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentAttachmentRepository extends JpaRepository<AssignmentAttachment, Long> {
    List<AssignmentAttachment> findByAssignmentId(Long assignmentId);
    void deleteByAssignmentId(Long assignmentId);
}