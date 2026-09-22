package com.project.fileserver.dto;

public class ShareRequest {
    private Long fileId;
    private Long folderId;
    private String permission = "VIEWER"; // VIEWER or EDITOR
    private Integer expiresInHours; // e.g. 24, 168 (7 days)

    public ShareRequest() {}

    public Long getFileId() { return fileId; }
    public void setFileId(Long fileId) { this.fileId = fileId; }

    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }

    public String getPermission() { return permission; }
    public void setPermission(String permission) { this.permission = permission; }

    public Integer getExpiresInHours() { return expiresInHours; }
    public void setExpiresInHours(Integer expiresInHours) { this.expiresInHours = expiresInHours; }
}
