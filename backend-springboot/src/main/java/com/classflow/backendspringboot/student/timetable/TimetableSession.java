package com.classflow.backendspringboot.student.timetable;

import com.classflow.backendspringboot.academic.AcademicClass;
import com.classflow.backendspringboot.student.course.Course;
import com.classflow.backendspringboot.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "timetable_sessions")
public class TimetableSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private AcademicClass academicClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @Column(length = 200)
    private String title;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Column(length = 80)
    private String room;

    @Column(name = "meeting_url", length = 500)
    private String meetingUrl;

    @Column(nullable = false)
    private boolean cancelled = false;

    @Column(name = "last_minute_change", nullable = false)
    private boolean lastMinuteChange = false;

    @Column(name = "change_note", length = 500)
    private String changeNote;

    public Long getId() { return id; }
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    public AcademicClass getAcademicClass() { return academicClass; }
    public void setAcademicClass(AcademicClass academicClass) { this.academicClass = academicClass; }
    public User getTeacher() { return teacher; }
    public void setTeacher(User teacher) { this.teacher = teacher; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }
    public Instant getEndsAt() { return endsAt; }
    public void setEndsAt(Instant endsAt) { this.endsAt = endsAt; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
    public String getMeetingUrl() { return meetingUrl; }
    public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }
    public boolean isCancelled() { return cancelled; }
    public void setCancelled(boolean cancelled) { this.cancelled = cancelled; }
    public boolean isLastMinuteChange() { return lastMinuteChange; }
    public void setLastMinuteChange(boolean lastMinuteChange) { this.lastMinuteChange = lastMinuteChange; }
    public String getChangeNote() { return changeNote; }
    public void setChangeNote(String changeNote) { this.changeNote = changeNote; }
}