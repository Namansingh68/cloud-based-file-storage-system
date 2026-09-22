package com.project.fileserver.service;

import com.project.fileserver.entity.FileMetadata;
import com.project.fileserver.entity.Folder;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.FileMetadataRepository;
import com.project.fileserver.repository.FolderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class FolderService {

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private FileMetadataRepository fileRepository;

    public Folder createFolder(String name, Long parentId, User user) {
        Folder parent = null;
        if (parentId != null) {
            parent = folderRepository.findByIdAndOwnerAndIsDeletedFalse(parentId, user)
                    .orElseThrow(() -> new IllegalArgumentException("Parent folder not found"));
        }

        Folder folder = new Folder(name, parent, user);
        return folderRepository.save(folder);
    }

    public Map<String, Object> getContents(Long folderId, User user) {
        Map<String, Object> response = new HashMap<>();

        Folder currentFolder = null;
        List<Map<String, Object>> breadcrumbs = new ArrayList<>();
        Map<String, Object> rootCrumb = new HashMap<>();
        rootCrumb.put("id", null);
        rootCrumb.put("name", "My Drive");
        breadcrumbs.add(rootCrumb);

        List<Folder> subFolders;
        List<FileMetadata> files;

        if (folderId == null) {
            subFolders = folderRepository.findByOwnerAndParentIsNullAndIsDeletedFalse(user);
            files = fileRepository.findByOwnerAndFolderIsNullAndIsDeletedFalse(user);
        } else {
            currentFolder = folderRepository.findByIdAndOwnerAndIsDeletedFalse(folderId, user)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

            subFolders = folderRepository.findByOwnerAndParentAndIsDeletedFalse(user, currentFolder);
            files = fileRepository.findByOwnerAndFolderAndIsDeletedFalse(user, currentFolder);

            // Construct breadcrumbs
            List<Map<String, Object>> parentChain = new ArrayList<>();
            Folder cursor = currentFolder;
            while (cursor != null) {
                Map<String, Object> crumb = new HashMap<>();
                crumb.put("id", cursor.getId());
                crumb.put("name", cursor.getName());
                parentChain.add(0, crumb);
                cursor = cursor.getParent();
            }
            breadcrumbs.addAll(parentChain);
        }

        response.put("currentFolder", currentFolder);
        response.put("breadcrumbs", breadcrumbs);
        response.put("folders", subFolders);
        response.put("files", files);

        return response;
    }

    public Folder rename(Long folderId, String newName, User user) {
        Folder folder = folderRepository.findByIdAndOwnerAndIsDeletedFalse(folderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
        folder.setName(newName);
        folder.setUpdatedAt(LocalDateTime.now());
        return folderRepository.save(folder);
    }

    public Folder move(Long folderId, Long targetFolderId, User user) {
        Folder folder = folderRepository.findByIdAndOwnerAndIsDeletedFalse(folderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        Folder targetParent = null;
        if (targetFolderId != null) {
            if (folderId.equals(targetFolderId)) {
                throw new IllegalArgumentException("Cannot move a folder into itself");
            }
            targetParent = folderRepository.findByIdAndOwnerAndIsDeletedFalse(targetFolderId, user)
                    .orElseThrow(() -> new IllegalArgumentException("Target folder not found"));
        }

        folder.setParent(targetParent);
        folder.setUpdatedAt(LocalDateTime.now());
        return folderRepository.save(folder);
    }

    public void softDelete(Long folderId, User user) {
        Folder folder = folderRepository.findByIdAndOwnerAndIsDeletedFalse(folderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
        folder.setIsDeleted(true);
        folder.setUpdatedAt(LocalDateTime.now());
        folderRepository.save(folder);
    }

    public void restore(Long folderId, User user) {
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
        folder.setIsDeleted(false);
        folder.setUpdatedAt(LocalDateTime.now());
        folderRepository.save(folder);
    }

    public void permanentDelete(Long folderId, User user) {
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
        folderRepository.delete(folder);
    }
}
