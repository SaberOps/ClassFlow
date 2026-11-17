package com.classflow.backendspringboot.common;

import com.classflow.backendspringboot.common.exception.ConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FileStorageServiceTest {
    @Test
    void acceptsAllowListedExtensionAndPersistsUnderGeneratedDownloadRoute() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForObject(anyString(), eq(Long.class))).thenReturn(41L);
        var stored = new FileStorageService(jdbc).store(
                new MockMultipartFile("file", "lesson.PDF", "application/pdf", new byte[]{1, 2, 3}), 9L);
        assertEquals("/api/files/41", stored.url());
        assertEquals("lesson.PDF", stored.fileName());
        verify(jdbc).update(contains("uploaded_files"), eq(9L), eq("lesson.PDF"), eq("pdf"),
                eq("application/pdf"), any(byte[].class));
    }

    @Test
    void rejectsUnsupportedExtensionBeforePersistence() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        var service = new FileStorageService(jdbc);
        assertThrows(ConflictException.class, () -> service.store(
                new MockMultipartFile("file", "payload.exe", "application/octet-stream", new byte[]{1}), 9L));
        verifyNoInteractions(jdbc);
    }

    @Test
    void rejectsFilesAboveTenMebibytesBeforePersistence() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        var service = new FileStorageService(jdbc);
        byte[] oversized = new byte[(int) FileStorageService.MAX_BYTES + 1];
        assertThrows(ConflictException.class, () -> service.store(
                new MockMultipartFile("file", "large.pdf", "application/pdf", oversized), 9L));
        verifyNoInteractions(jdbc);
    }
}
