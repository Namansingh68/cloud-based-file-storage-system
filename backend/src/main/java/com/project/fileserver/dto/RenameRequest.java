package com.project.fileserver.dto;

public class RenameRequest {
    private String newName;

    public RenameRequest() {}
    public RenameRequest(String newName) {
        this.newName = newName;
    }

    public String getNewName() { return newName; }
    public void setNewName(String newName) { this.newName = newName; }
}
