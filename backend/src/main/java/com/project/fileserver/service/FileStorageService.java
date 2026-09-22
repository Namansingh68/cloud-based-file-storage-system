package com.project.fileserver.service;

import com.project.fileserver.entity.FileMetadata;
import com.project.fileserver.entity.Folder;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.FileMetadataRepository;
import com.project.fileserver.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path rootLocation;
    private final FileMetadataRepository fileRepository;
    private final UserRepository userRepository;

    @Autowired
    public FileStorageService(
            @Value("${app.storage.upload-dir:./storage_uploads}") String uploadDir,
            FileMetadataRepository fileRepository,
            UserRepository userRepository) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;

        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

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

        // User isolated storage directory
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

        FileMetadata saved = fileRepository.save(metadata);

        // Update user storage
        user.setUsedStorage(newUsed);
        userRepository.save(user);

        return saved;
    }

    public Resource loadAsResource(FileMetadata metadata) {
        try {
            Path filePath = Paths.get(metadata.getStoragePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file: " + metadata.getName());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Malformed file path", e);
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

    public void permanentDelete(FileMetadata metadata, User user) {
        try {
            Path filePath = Paths.get(metadata.getStoragePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            System.err.println("Warning: Could not delete physical file: " + e.getMessage());
        }
        fileRepository.delete(metadata);
    }
}
