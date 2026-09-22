package com.project.fileserver.controller;

import com.project.fileserver.entity.FileMetadata;
import com.project.fileserver.entity.Folder;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trash")
@Tag(name = "Trash", description = "Recycle bin for soft-deleted items (FR-17)")
public class TrashController {

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

    @GetMapping
    @Operation(summary = "List all soft-deleted files and folders (FR-17)")
    public ResponseEntity<?> getTrashItems() {
        User user = getAuthenticatedUser();
        List<FileMetadata> deletedFiles = fileRepository.findByOwnerAndIsDeletedTrue(user);
        List<Folder> deletedFolders = folderRepository.findByOwnerAndIsDeletedTrue(user);

        return ResponseEntity.ok(Map.of(
                "files", deletedFiles,
                "folders", deletedFolders
        ));
    }
}
