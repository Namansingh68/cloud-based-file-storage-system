package com.project.fileserver.repository;

import com.project.fileserver.entity.FileMetadata;
import com.project.fileserver.entity.Folder;
import com.project.fileserver.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {
    List<FileMetadata> findByOwnerAndFolderAndIsDeletedFalse(User owner, Folder folder);
    List<FileMetadata> findByOwnerAndFolderIsNullAndIsDeletedFalse(User owner);
    List<FileMetadata> findByOwnerAndIsDeletedTrue(User owner);
    Optional<FileMetadata> findByIdAndOwner(Long id, User owner);
    Optional<FileMetadata> findByIdAndOwnerAndIsDeletedFalse(Long id, User owner);

    @Query("SELECT f FROM FileMetadata f WHERE f.owner = :owner AND f.isDeleted = false AND LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<FileMetadata> searchFiles(@Param("owner") User owner, @Param("query") String query);

    @Query("SELECT COALESCE(SUM(f.size), 0) FROM FileMetadata f WHERE f.owner = :owner AND f.isDeleted = false")
    Long calculateTotalUsedStorage(@Param("owner") User owner);

    long countByOwnerAndIsDeletedFalse(User owner);
}
