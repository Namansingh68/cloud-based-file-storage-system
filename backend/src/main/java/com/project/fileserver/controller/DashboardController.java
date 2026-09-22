package com.project.fileserver.controller;

import com.project.fileserver.dto.DashboardStats;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.FileMetadataRepository;
import com.project.fileserver.repository.FolderRepository;
import com.project.fileserver.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "User dashboard, quotas, and quick statistics (FR-14, FR-18)")
public class DashboardController {

    @Autowired
    private FileMetadataRepository fileRepository;

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get user storage statistics and counts (FR-14, FR-18)")
    public ResponseEntity<DashboardStats> getStats() {
        User user = getAuthenticatedUser();
        Long usedStorage = user.getUsedStorage();
        Long quota = user.getStorageQuota();
        long fileCount = fileRepository.countByOwnerAndIsDeletedFalse(user);
        long folderCount = folderRepository.countByOwnerAndIsDeletedFalse(user);

        DashboardStats stats = new DashboardStats(usedStorage, quota, fileCount, folderCount, null);
        return ResponseEntity.ok(stats);
    }
}
