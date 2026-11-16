package com.classflow.backendspringboot.student.timetable;

import com.classflow.backendspringboot.student.course.Course;
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
    public boolean isLastMinuteChange() { return lastMinuteChange; }
    public String getChangeNote() { return changeNote; }
}