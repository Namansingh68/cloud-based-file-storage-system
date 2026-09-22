package com.project.fileserver.repository;

import com.project.fileserver.entity.FileContent;
import com.project.fileserver.entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FileContentRepository extends JpaRepository<FileContent, Long> {
    Optional<FileContent> findByFile(FileMetadata file);
    Optional<FileContent> findByFileId(Long fileId);
    void deleteByFile(FileMetadata file);
}
