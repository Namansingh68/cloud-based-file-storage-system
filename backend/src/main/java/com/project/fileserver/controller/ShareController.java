package com.project.fileserver.controller;

import com.project.fileserver.dto.ShareRequest;
import com.project.fileserver.entity.FileMetadata;
import com.project.fileserver.entity.ShareLink;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.UserRepository;
import com.project.fileserver.service.ActivityService;
import com.project.fileserver.service.FileStorageService;
import com.project.fileserver.service.ShareService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/share")
@Tag(name = "Sharing", description = "Shareable links and permission controls (FR-09, FR-10, FR-11)")
public class ShareController {

    @Autowired
    private ShareService shareService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityService activityService;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @PostMapping
    @Operation(summary = "Generate shareable link with configurable permission and expiration (FR-09, FR-10)")
    public ResponseEntity<?> createShareLink(@RequestBody ShareRequest request) {
        User user = getAuthenticatedUser();
        ShareLink shareLink = shareService.createShareLink(
                user,
                request.getFileId(),
                request.getFolderId(),
                request.getPermission(),
                request.getExpiresInHours()
        );

        activityService.log(user, "SHARE",
                request.getFileId() != null ? "FILE" : "FOLDER",
                request.getFileId() != null ? request.getFileId() : request.getFolderId(),
                shareLink.getFile() != null ? shareLink.getFile().getName() : shareLink.getFolder().getName(),
                "Shared with " + request.getPermission() + " permission");

        return ResponseEntity.ok(Map.of(
                "token", shareLink.getToken(),
                "permission", shareLink.getPermission(),
                "expiresAt", shareLink.getExpiresAt() != null ? shareLink.getExpiresAt().toString() : "never"
        ));
    }

    @GetMapping("/{token}")
    @Operation(summary = "Get shared file or folder by token (Public access)")
    public ResponseEntity<?> getSharedResource(@PathVariable String token) {
        try {
            ShareLink link = shareService.getValidShareLink(token);
            return ResponseEntity.ok(Map.of(
                    "permission", link.getPermission(),
                    "file", link.getFile() != null ? link.getFile() : null,
                    "folder", link.getFolder() != null ? link.getFolder() : null,
                    "expiresAt", link.getExpiresAt() != null ? link.getExpiresAt().toString() : "never"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{token}/download")
    @Operation(summary = "Download file via shared token (Public access)")
    public ResponseEntity<?> downloadSharedFile(@PathVariable String token) {
        try {
            ShareLink link = shareService.getValidShareLink(token);
            FileMetadata file = link.getFile();
            if (file == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Link does not point to a file"));
            }

            Resource resource = fileStorageService.loadAsResource(file);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
