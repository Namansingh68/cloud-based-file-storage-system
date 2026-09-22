package com.project.fileserver.dto;

import com.project.fileserver.entity.User;

public class AuthResponse {
    private String token;
    private UserDto user;

    public AuthResponse() {}
    public AuthResponse(String token, User user) {
        this.token = token;
        this.user = new UserDto(user);
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public static class UserDto {
        private Long id;
        private String email;
        private String name;
        private Long storageQuota;
        private Long usedStorage;
        private String role;

        public UserDto(User user) {
            this.id = user.getId();
            this.email = user.getEmail();
            this.name = user.getName();
            this.storageQuota = user.getStorageQuota();
            this.usedStorage = user.getUsedStorage();
            this.role = user.getRole();
        }

        public Long getId() { return id; }
        public String getEmail() { return email; }
        public String getName() { return name; }
        public Long getStorageQuota() { return storageQuota; }
        public Long getUsedStorage() { return usedStorage; }
        public String getRole() { return role; }
    }
}
