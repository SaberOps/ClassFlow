package com.classflow.backendspringboot.common;

public enum AssignmentStatus {
    TODO,        // à rendre
    SUBMITTED,   // rendu
    LATE,        // échéance dépassée sans rendu (affichage)
    IN_REVIEW,   // en correction
    GRADED       // noté
}