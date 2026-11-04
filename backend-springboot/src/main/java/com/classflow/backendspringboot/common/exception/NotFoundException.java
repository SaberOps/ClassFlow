package com.classflow.backendspringboot.common.exception;

/** Resource not found (or soft-deleted): mapped to HTTP 404. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
