package com.classflow.backendspringboot.student.assignment;

import com.classflow.backendspringboot.common.AssignmentStatus;
import com.classflow.backendspringboot.common.CurrentStudent;
import com.classflow.backendspringboot.student.submission.SubmissionDtos;
import com.classflow.backendspringboot.student.submission.StudentSubmissionService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/assignments")
@PreAuthorize("hasRole('STUDENT')")
public class StudentAssignmentController {

    private final StudentAssignmentService assignmentService;
    private final StudentSubmissionService submissionService;
    private final CurrentStudent currentStudent;

    public StudentAssignmentController(
            StudentAssignmentService assignmentService,
            StudentSubmissionService submissionService,
            CurrentStudent currentStudent) {
        this.assignmentService = assignmentService;
        this.submissionService = submissionService;
        this.currentStudent = currentStudent;
    }

    /** US27 — liste + filtre optionnel courseId / status */
    @GetMapping
    public List<AssignmentDtos.AssignmentListItem> list(
            Authentication authentication,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) AssignmentStatus status) {
        return assignmentService.list(currentStudent.require(authentication), courseId, status);
    }

    /** US30 */
    @GetMapping("/grades")
    public List<AssignmentDtos.GradeItem> grades(Authentication authentication) {
        return assignmentService.myGrades(currentStudent.require(authentication));
    }

    @GetMapping("/{id}")
    public AssignmentDtos.AssignmentDetail detail(
            Authentication authentication,
            @PathVariable Long id) {
        return assignmentService.detail(currentStudent.require(authentication), id);
    }

    /** US28 */
    @PostMapping("/{id}/submissions")
    public SubmissionDtos.SubmissionDto submit(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SubmissionDtos.SubmitRequest request) {
        return submissionService.submit(currentStudent.require(authentication), id, request);
    }
}