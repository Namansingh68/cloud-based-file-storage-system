package com.project.fileserver.service;

import com.project.fileserver.entity.FileContent;
import com.project.fileserver.entity.FileMetadata;
import com.project.fileserver.entity.Folder;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.FileContentRepository;
import com.project.fileserver.repository.FileMetadataRepository;
import com.project.fileserver.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path rootLocation;
    private final FileMetadataRepository fileRepository;
    private final UserRepository userRepository;
    private final FileContentRepository fileContentRepository;

    @Value("${app.storage.type:filesystem}")
    private String storageType;

    @Autowired
    public FileStorageService(
            @Value("${app.storage.upload-dir:./storage_uploads}") String uploadDir,
            FileMetadataRepository fileRepository,
            UserRepository userRepository,
            FileContentRepository fileContentRepository) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.fileContentRepository = fileContentRepository;

        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            System.err.println("Notice: Could not create local storage directory: " + e.getMessage());
        }
    }

    private boolean isDatabaseStorage() {
        return "database".equalsIgnoreCase(storageType) || "db".equalsIgnoreCase(storageType);
    }

    @Transactional
    public FileMetadata store(MultipartFile file, User user, Folder folder) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.contains("..")) {
            throw new IllegalArgumentException("Invalid file name: " + originalFilename);
        }

        // Quota check (FR-18)
        long newUsed = user.getUsedStorage() + file.getSize();
        if (newUsed > user.getStorageQuota()) {
            throw new IllegalStateException("Storage quota exceeded. Cannot upload " + originalFilename);
        }

        FileMetadata saved;

        if (isDatabaseStorage()) {
            // Persistent Database-backed Storage (for Cloud deployments on Render + Supabase)
            String storageUri = "db://" + UUID.randomUUID().toString();
            FileMetadata metadata = new FileMetadata(
                    originalFilename,
                    originalFilename,
                    storageUri,
                    file.getSize(),
                    file.getContentType(),
                    user,
                    folder
            );
            saved = fileRepository.save(metadata);

            FileContent fileContent = new FileContent(saved, file.getBytes());
            fileContentRepository.save(fileContent);
        } else {
            // Local Disk Storage (for local dev with ./storage_uploads)
            Path userDir = this.rootLocation.resolve(user.getId().toString());
            Files.createDirectories(userDir);

            String storedFileName = UUID.randomUUID().toString() + "_" + originalFilename;
            Path destination = userDir.resolve(storedFileName);

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            FileMetadata metadata = new FileMetadata(
                    originalFilename,
                    originalFilename,
                    destination.toString(),
                    file.getSize(),
                    file.getContentType(),
                    user,
                    folder
            );
            saved = fileRepository.save(metadata);
        }

        // Update user storage
        user.setUsedStorage(newUsed);
        userRepository.save(user);

        return saved;
    }

    @Transactional(readOnly = true)
    public Resource loadAsResource(FileMetadata metadata) {
        String path = metadata.getStoragePath();

        // 1. Check if stored in database or configured for database
        if (path != null && path.startsWith("db://")) {
            Optional<FileContent> contentOpt = fileContentRepository.findByFile(metadata);
            if (contentOpt.isPresent()) {
                byte[] data = contentOpt.get().getData();
                return new ByteArrayResource(data) {
                    @Override
                    public String getFilename() {
                        return metadata.getName();
                    }
                };
            }
        }

        // 2. Also check if fileContent exists in repository regardless of path prefix
        Optional<FileContent> fallbackDb = fileContentRepository.findByFile(metadata);
        if (fallbackDb.isPresent()) {
            byte[] data = fallbackDb.get().getData();
            return new ByteArrayResource(data) {
                @Override
                public String getFilename() {
                    return metadata.getName();
                }
            };
        }

        // 3. Fallback to Local Disk filesystem
        try {
            Path filePath = Paths.get(metadata.getStoragePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file: " + metadata.getName());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Malformed file path: " + metadata.getStoragePath(), e);
        }
    }

    public void softDelete(FileMetadata metadata, User user) {
        metadata.setIsDeleted(true);
        metadata.setUpdatedAt(LocalDateTime.now());
        fileRepository.save(metadata);

        // Decrement user active storage
        long updatedUsed = Math.max(0L, user.getUsedStorage() - metadata.getSize());
        user.setUsedStorage(updatedUsed);
        userRepository.save(user);
    }

    public void restore(FileMetadata metadata, User user) {
        metadata.setIsDeleted(false);
        metadata.setUpdatedAt(LocalDateTime.now());
        fileRepository.save(metadata);

        // Re-add to storage
        user.setUsedStorage(user.getUsedStorage() + metadata.getSize());
        userRepository.save(user);
    }

    @Transactional
    public void permanentDelete(FileMetadata metadata, User user) {
        // Delete binary content if in DB
        fileContentRepository.deleteByFile(metadata);

        // Delete from local disk if exists
        try {
            if (metadata.getStoragePath() != null && !metadata.getStoragePath().startsWith("db://")) {
                Path filePath = Paths.get(metadata.getStoragePath());
                Files.deleteIfExists(filePath);
            }
        } catch (Exception e) {
            System.err.println("Notice: Could not delete physical file from disk: " + e.getMessage());
        }

        fileRepository.delete(metadata);
    }
}
