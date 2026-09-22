package com.project.fileserver.controller;

import com.project.fileserver.dto.FolderRequest;
import com.project.fileserver.dto.MoveRequest;
import com.project.fileserver.dto.RenameRequest;
import com.project.fileserver.entity.Folder;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.UserRepository;
import com.project.fileserver.service.ActivityService;
import com.project.fileserver.service.FolderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/folders")
@Tag(name = "Folders", description = "Hierarchical folder management (FR-06, FR-07)")
public class FolderController {

    @Autowired
    private FolderService folderService;

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
    @Operation(summary = "Create hierarchical folder (FR-06)")
    public ResponseEntity<?> createFolder(@RequestBody FolderRequest request) {
        User user = getAuthenticatedUser();
        Folder folder = folderService.createFolder(request.getName(), request.getParentId(), user);
        activityService.log(user, "CREATE_FOLDER", "FOLDER", folder.getId(), folder.getName(), "Created folder");
        return ResponseEntity.ok(folder);
    }

    @GetMapping("/contents")
    @Operation(summary = "Get folder contents (files, subfolders, breadcrumbs)")
    public ResponseEntity<?> getContents(@RequestParam(value = "folderId", required = false) Long folderId) {
        User user = getAuthenticatedUser();
        Map<String, Object> contents = folderService.getContents(folderId, user);
        return ResponseEntity.ok(contents);
    }

    @PutMapping("/{id}/rename")
    @Operation(summary = "Rename folder (FR-07)")
    public ResponseEntity<?> renameFolder(@PathVariable Long id, @RequestBody RenameRequest request) {
        User user = getAuthenticatedUser();
        Folder folder = folderService.rename(id, request.getNewName(), user);
        activityService.log(user, "RENAME", "FOLDER", folder.getId(), folder.getName(), "Renamed folder");
        return ResponseEntity.ok(folder);
    }

    @PutMapping("/{id}/move")
    @Operation(summary = "Move folder to another parent (FR-07)")
    public ResponseEntity<?> moveFolder(@PathVariable Long id, @RequestBody MoveRequest request) {
        User user = getAuthenticatedUser();
        Folder folder = folderService.move(id, request.getTargetFolderId(), user);
        activityService.log(user, "MOVE", "FOLDER", folder.getId(), folder.getName(), "Moved folder");
        return ResponseEntity.ok(folder);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Move folder to trash (FR-17)")
    public ResponseEntity<?> moveToTrash(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        folderService.softDelete(id, user);
        activityService.log(user, "DELETE", "FOLDER", id, "Folder", "Moved to trash");
        return ResponseEntity.ok(Map.of("message", "Folder moved to trash"));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore folder from trash (FR-17)")
    public ResponseEntity<?> restoreFolder(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        folderService.restore(id, user);
        activityService.log(user, "RESTORE", "FOLDER", id, "Folder", "Restored folder");
        return ResponseEntity.ok(Map.of("message", "Folder restored"));
    }

    @DeleteMapping("/{id}/permanent")
    @Operation(summary = "Permanently delete folder")
    public ResponseEntity<?> permanentDeleteFolder(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        folderService.permanentDelete(id, user);
        activityService.log(user, "PURGE", "FOLDER", id, "Folder", "Permanently deleted folder");
        return ResponseEntity.ok(Map.of("message", "Folder permanently deleted"));
    }
}
