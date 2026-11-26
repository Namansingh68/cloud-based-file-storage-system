package com.project.fileserver.service;

import com.project.fileserver.entity.FileMetadata;
import com.project.fileserver.entity.Folder;
import com.project.fileserver.entity.ShareLink;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.FileMetadataRepository;
import com.project.fileserver.repository.FolderRepository;
import com.project.fileserver.repository.ShareLinkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class ShareService {

    @Autowired
    private ShareLinkRepository shareLinkRepository;

    @Autowired
    private FileMetadataRepository fileRepository;

    @Autowired
    private FolderRepository folderRepository;

    private static final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public ShareLink createShareLink(User user, Long fileId, Long folderId, String permission, Integer expiresInHours) {
        FileMetadata file = null;
        Folder folder = null;

        if (fileId != null) {
            file = fileRepository.findByIdAndOwnerAndIsDeletedFalse(fileId, user)
                    .orElseThrow(() -> new IllegalArgumentException("File not found or deleted"));
        } else if (folderId != null) {
            folder = folderRepository.findByIdAndOwnerAndIsDeletedFalse(folderId, user)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found or deleted"));
        } else {
            throw new IllegalArgumentException("Must specify either fileId or folderId to share");
        }

        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        LocalDateTime expiresAt = null;
        if (expiresInHours != null && expiresInHours > 0) {
            expiresAt = LocalDateTime.now().plusHours(expiresInHours);
        }

        ShareLink shareLink = new ShareLink(token, file, folder, permission, expiresAt, user);
        return shareLinkRepository.save(shareLink);
    }

    @Transactional(readOnly = true)
    public ShareLink getValidShareLink(String token) {
        ShareLink shareLink = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid share token"));

        if (shareLink.isExpired()) {
            throw new IllegalStateException("This share link has expired");
        }

        // Eagerly initialize target within transaction before controller serialization
        if (shareLink.getFile() != null) {
            shareLink.getFile().getName();
        }
        if (shareLink.getFolder() != null) {
            shareLink.getFolder().getName();
        }

        return shareLink;
    }
}
