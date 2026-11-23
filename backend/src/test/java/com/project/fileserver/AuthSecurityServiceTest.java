package com.project.fileserver;

import com.project.fileserver.service.AuthSecurityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AuthSecurityServiceTest {

    private AuthSecurityService securityService;

    @BeforeEach
    void setUp() {
        securityService = new AuthSecurityService();
    }

    @Test
    void testNormalizeEmail() {
        assertEquals("user@example.com", securityService.normalizeEmail("  USER@EXAMPLE.COM  "));
        assertEquals("test.dev@sub.domain.org", securityService.normalizeEmail("Test.Dev@Sub.Domain.Org"));
        assertEquals("", securityService.normalizeEmail(null));
    }

    @Test
    void testEmailSyntaxValidation() {
        assertTrue(securityService.isValidEmail("alex@domain.com"));
        assertTrue(securityService.isValidEmail("john.doe+tag@sub.domain.edu"));
        
        assertFalse(securityService.isValidEmail("plainaddress"));
        assertFalse(securityService.isValidEmail("@missingusername.com"));
        assertFalse(securityService.isValidEmail("missingdomain@"));
        assertFalse(securityService.isValidEmail("invalid..dots@domain.com"));
        assertFalse(securityService.isValidEmail(""));
        assertFalse(securityService.isValidEmail(null));
    }

    @Test
    void testOtpGenerationAndHashing() {
        String otp = securityService.generateSecureOtp();
        assertNotNull(otp);
        assertEquals(6, otp.length());
        assertTrue(otp.matches("^\\d{6}$"));

        String hash = securityService.hashOtp(otp);
        assertNotNull(hash);
        assertEquals(64, hash.length()); // SHA-256 hex string

        assertTrue(securityService.verifyOtpHash(otp, hash));
        assertFalse(securityService.verifyOtpHash("000000", hash));
    }

    @Test
    void testVerificationTokenGeneration() {
        String token1 = securityService.generateVerificationToken();
        String token2 = securityService.generateVerificationToken();
        assertNotNull(token1);
        assertNotNull(token2);
        assertNotEquals(token1, token2);
        assertTrue(token1.length() >= 32);
    }
}
