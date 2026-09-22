package com.project.fileserver.dto;

import com.project.fileserver.entity.FileMetadata;
import java.util.List;

public class DashboardStats {
    private Long usedStorage;
    private Long storageQuota;
    private Long fileCount;
    private Long folderCount;
    private List<FileMetadata> recentFiles;

    public DashboardStats() {}

    public DashboardStats(Long usedStorage, Long storageQuota, Long fileCount, Long folderCount, List<FileMetadata> recentFiles) {
        this.usedStorage = usedStorage;
        this.storageQuota = storageQuota;
        this.fileCount = fileCount;
        this.folderCount = folderCount;
        this.recentFiles = recentFiles;
    }

    public Long getUsedStorage() { return usedStorage; }
    public void setUsedStorage(Long usedStorage) { this.usedStorage = usedStorage; }

    public Long getStorageQuota() { return storageQuota; }
    public void setStorageQuota(Long storageQuota) { this.storageQuota = storageQuota; }

    public Long getFileCount() { return fileCount; }
    public void setFileCount(Long fileCount) { this.fileCount = fileCount; }

    public Long getFolderCount() { return folderCount; }
    public void setFolderCount(Long folderCount) { this.folderCount = folderCount; }

    public List<FileMetadata> getRecentFiles() { return recentFiles; }
    public void setRecentFiles(List<FileMetadata> recentFiles) { this.recentFiles = recentFiles; }
}
