package com.project.fileserver.repository;

import com.project.fileserver.entity.Folder;
import com.project.fileserver.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByOwnerAndParentAndIsDeletedFalse(User owner, Folder parent);
    List<Folder> findByOwnerAndParentIsNullAndIsDeletedFalse(User owner);
    List<Folder> findByOwnerAndIsDeletedTrue(User owner);
    Optional<Folder> findByIdAndOwner(Long id, User owner);
    Optional<Folder> findByIdAndOwnerAndIsDeletedFalse(Long id, User owner);
    long countByOwnerAndIsDeletedFalse(User owner);
}
