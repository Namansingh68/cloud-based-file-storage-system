package com.project.fileserver.controller;

import com.project.fileserver.dto.MoveRequest;
import com.project.fileserver.dto.RenameRequest;
import com.project.fileserver.entity.FileMetadata;
import com.project.fileserver.entity.Folder;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.FileMetadataRepository;
import com.project.fileserver.repository.FolderRepository;
import com.project.fileserver.repository.UserRepository;
import com.project.fileserver.service.ActivityService;
import com.project.fileserver.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@Tag(name = "Files", description = "File upload, download, preview, and manipulation (FR-04, FR-05, FR-07, FR-16)")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private FileMetadataRepository fileRepository;

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityService activityService;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a file with size validation and quota enforcement (FR-04, FR-18)")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) Long folderId) {
        try {
            User user = getAuthenticatedUser();
            Folder folder = null;
            if (folderId != null) {
                folder = folderRepository.findByIdAndOwnerAndIsDeletedFalse(folderId, user)
                        .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
            }

            FileMetadata saved = fileStorageService.store(file, user, folder);
            activityService.log(user, "UPLOAD", "FILE", saved.getId(), saved.getName(), "Uploaded " + file.getSize() + " bytes");

            return ResponseEntity.ok(saved);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Upload error: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download file as attachment (FR-05)")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        FileMetadata metadata = fileRepository.findByIdAndOwnerAndIsDeletedFalse(id, user)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        Resource resource = fileStorageService.loadAsResource(metadata);
        activityService.log(user, "DOWNLOAD", "FILE", metadata.getId(), metadata.getName(), "Downloaded file");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + metadata.getName() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/preview")
    @Operation(summary = "Preview file inline in browser without downloading (FR-16)")
    public ResponseEntity<Resource> previewFile(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        FileMetadata metadata = fileRepository.findByIdAndOwnerAndIsDeletedFalse(id, user)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        Resource resource = fileStorageService.loadAsResource(metadata);
        String contentType = metadata.getContentType();
        if (contentType == null || contentType.isEmpty()) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + metadata.getName() + "\"")
                .body(resource);
    }

    @PutMapping("/{id}/rename")
    @Operation(summary = "Rename file (FR-07)")
    public ResponseEntity<?> renameFile(@PathVariable Long id, @RequestBody RenameRequest request) {
        User user = getAuthenticatedUser();
        FileMetadata metadata = fileRepository.findByIdAndOwnerAndIsDeletedFalse(id, user)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        String oldName = metadata.getName();
        metadata.setName(request.getNewName());
        metadata.setUpdatedAt(LocalDateTime.now());
        FileMetadata saved = fileRepository.save(metadata);

        activityService.log(user, "RENAME", "FILE", saved.getId(), saved.getName(), "Renamed from " + oldName);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/move")
    @Operation(summary = "Move file to target folder (FR-07)")
    public ResponseEntity<?> moveFile(@PathVariable Long id, @RequestBody MoveRequest request) {
        User user = getAuthenticatedUser();
        FileMetadata metadata = fileRepository.findByIdAndOwnerAndIsDeletedFalse(id, user)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        Folder targetFolder = null;
        if (request.getTargetFolderId() != null) {
            targetFolder = folderRepository.findByIdAndOwnerAndIsDeletedFalse(request.getTargetFolderId(), user)
                    .orElseThrow(() -> new IllegalArgumentException("Target folder not found"));
        }

        metadata.setFolder(targetFolder);
        metadata.setUpdatedAt(LocalDateTime.now());
        FileMetadata saved = fileRepository.save(metadata);

        activityService.log(user, "MOVE", "FILE", saved.getId(), saved.getName(), "Moved file");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Move file to trash / soft-delete (FR-17)")
    public ResponseEntity<?> moveToTrash(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        FileMetadata metadata = fileRepository.findByIdAndOwnerAndIsDeletedFalse(id, user)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        fileStorageService.softDelete(metadata, user);
        activityService.log(user, "DELETE", "FILE", metadata.getId(), metadata.getName(), "Moved to trash");

        return ResponseEntity.ok(Map.of("message", "File moved to trash"));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore file from trash (FR-17)")
    public ResponseEntity<?> restoreFile(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        FileMetadata metadata = fileRepository.findByIdAndOwner(id, user)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        fileStorageService.restore(metadata, user);
        activityService.log(user, "RESTORE", "FILE", metadata.getId(), metadata.getName(), "Restored file");

        return ResponseEntity.ok(Map.of("message", "File restored"));
    }

    @DeleteMapping("/{id}/permanent")
    @Operation(summary = "Permanently delete file from disk and database")
    public ResponseEntity<?> permanentDeleteFile(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        FileMetadata metadata = fileRepository.findByIdAndOwner(id, user)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        fileStorageService.permanentDelete(metadata, user);
        activityService.log(user, "PURGE", "FILE", id, metadata.getName(), "Permanently deleted");

        return ResponseEntity.ok(Map.of("message", "File permanently deleted"));
    }
}
