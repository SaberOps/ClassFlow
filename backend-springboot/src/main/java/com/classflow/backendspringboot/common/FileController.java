package com.classflow.backendspringboot.common;

import com.classflow.backendspringboot.common.exception.NotFoundException;
import com.classflow.backendspringboot.user.UserRepository;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private final FileStorageService files;
    private final UserRepository users;

    public FileController(FileStorageService files, UserRepository users) {
        this.files = files;
        this.users = users;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FileStorageService.StoredFile upload(
            @RequestPart("file") MultipartFile file, Authentication authentication) {
        var user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(authentication.getName())
                .orElseThrow(() -> new NotFoundException("Account not found"));
        return files.store(file, user.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> download(@PathVariable long id, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        FileStorageService.FileDownload file = files.load(id, authentication.getName(), admin);
        MediaType type = MediaType.APPLICATION_OCTET_STREAM;
        if (file.contentType() != null) {
            try {
                type = MediaType.parseMediaType(file.contentType());
            } catch (IllegalArgumentException ignored) {
                type = MediaType.APPLICATION_OCTET_STREAM;
            }
        }
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.fileName()).build().toString())
                .body(file.content());
    }
}
