package com.project.fileserver.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AuthSecurityService {

    private final SecureRandom secureRandom = new SecureRandom();

    // RFC 5322 compliant email regex pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );

    /**
     * Normalize email address by trimming whitespace and converting to lowercase.
     */
    public String normalizeEmail(String email) {
        if (email == null) return "";
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Strictly validate email syntax.
     */
    public boolean isValidEmail(String email) {
        if (email == null) return false;
        String normalized = email.trim();
        if (normalized.length() < 5 || normalized.length() > 254) return false;
        return EMAIL_PATTERN.matcher(normalized).matches();
    }

    /**
     * Generate a cryptographically secure 6-digit numeric OTP.
     */
    public String generateSecureOtp() {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * Generate a cryptographically secure single-use URL verification token.
     */
    public String generateVerificationToken() {
        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        StringBuilder sb = new StringBuilder(UUID.randomUUID().toString().replace("-", ""));
        for (byte b : randomBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * Hash OTP with SHA-256 so raw OTP is never stored in plain text.
     */
    public String hashOtp(String otp) {
        if (otp == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Constant-time verification of raw OTP against stored SHA-256 hash.
     */
    public boolean verifyOtpHash(String rawOtp, String storedHash) {
        if (rawOtp == null || storedHash == null) return false;
        String rawOtpHash = hashOtp(rawOtp);
        return MessageDigest.isEqual(
                rawOtpHash.getBytes(StandardCharsets.UTF_8),
                storedHash.getBytes(StandardCharsets.UTF_8)
        );
    }
}
