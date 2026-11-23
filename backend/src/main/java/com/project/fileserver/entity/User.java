package com.project.fileserver.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Long storageQuota = 524288000L; // Default 500MB per SRS

    @Column(nullable = false)
    private Long usedStorage = 0L;

    @Column(nullable = false)
    private String role = "ROLE_USER";

    @Column(nullable = false)
    private boolean emailVerified = false;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(length = 100)
    private String verificationOtpHash;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(length = 100)
    private String verificationToken;

    @Column
    private LocalDateTime verificationOtpExpiry;

    @Column(nullable = false)
    private int verificationAttempts = 0;

    @Column
    private LocalDateTime lastVerificationSentAt;

    @Column
    private LocalDateTime emailVerifiedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public User() {}

    public User(String email, String passwordHash, String name) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getStorageQuota() { return storageQuota; }
    public void setStorageQuota(Long storageQuota) { this.storageQuota = storageQuota; }

    public Long getUsedStorage() { return usedStorage; }
    public void setUsedStorage(Long usedStorage) { this.usedStorage = usedStorage; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public String getVerificationOtpHash() { return verificationOtpHash; }
    public void setVerificationOtpHash(String verificationOtpHash) { this.verificationOtpHash = verificationOtpHash; }

    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }

    public LocalDateTime getVerificationOtpExpiry() { return verificationOtpExpiry; }
    public void setVerificationOtpExpiry(LocalDateTime verificationOtpExpiry) { this.verificationOtpExpiry = verificationOtpExpiry; }

    public int getVerificationAttempts() { return verificationAttempts; }
    public void setVerificationAttempts(int verificationAttempts) { this.verificationAttempts = verificationAttempts; }

    public LocalDateTime getLastVerificationSentAt() { return lastVerificationSentAt; }
    public void setLastVerificationSentAt(LocalDateTime lastVerificationSentAt) { this.lastVerificationSentAt = lastVerificationSentAt; }

    public LocalDateTime getEmailVerifiedAt() { return emailVerifiedAt; }
    public void setEmailVerifiedAt(LocalDateTime emailVerifiedAt) { this.emailVerifiedAt = emailVerifiedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
