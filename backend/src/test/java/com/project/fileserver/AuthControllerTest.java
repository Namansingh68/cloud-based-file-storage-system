package com.project.fileserver;

import com.project.fileserver.controller.AuthController;
import com.project.fileserver.dto.AuthRequest;
import com.project.fileserver.dto.RegisterRequest;
import com.project.fileserver.dto.VerifyOtpRequest;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.UserRepository;
import com.project.fileserver.security.JwtUtils;
import com.project.fileserver.service.AuthSecurityService;
import com.project.fileserver.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private EmailService emailService;

    @Mock
    private AuthSecurityService authSecurityService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void register_withMalformedEmail_shouldReturnBadRequest() {
        when(authSecurityService.normalizeEmail("invalid-email")).thenReturn("invalid-email");
        when(authSecurityService.isValidEmail("invalid-email")).thenReturn(false);

        RegisterRequest req = new RegisterRequest("Test User", "invalid-email", "secret123");
        ResponseEntity<?> response = authController.register(req);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("valid email"));
    }

    @Test
    void register_withValidEmail_shouldCreateUnverifiedUser() {
        when(authSecurityService.normalizeEmail("test@example.com")).thenReturn("test@example.com");
        when(authSecurityService.isValidEmail("test@example.com")).thenReturn(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPass");
        when(authSecurityService.generateSecureOtp()).thenReturn("123456");
        when(authSecurityService.generateVerificationToken()).thenReturn("mock-token-xyz");
        when(authSecurityService.hashOtp("123456")).thenReturn("hashedOtp123");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        RegisterRequest req = new RegisterRequest("Test User", "test@example.com", "secret123");
        ResponseEntity<?> response = authController.register(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(emailService, times(1)).sendVerificationEmail(eq("test@example.com"), anyString(), eq("123456"), anyString());
    }

    @Test
    void login_whenEmailNotVerified_shouldReturnForbidden() {
        when(authSecurityService.normalizeEmail("unverified@example.com")).thenReturn("unverified@example.com");
        when(authSecurityService.isValidEmail("unverified@example.com")).thenReturn(true);

        User unverifiedUser = new User("unverified@example.com", "hashedPass", "User");
        unverifiedUser.setEmailVerified(false);

        when(userRepository.findByEmail("unverified@example.com")).thenReturn(Optional.of(unverifiedUser));
        when(passwordEncoder.matches("secret123", "hashedPass")).thenReturn(true);

        AuthRequest req = new AuthRequest("unverified@example.com", "secret123");
        ResponseEntity<?> response = authController.login(req);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("EMAIL_NOT_VERIFIED", body.get("errorCode"));
    }

    @Test
    void login_whenVerifiedAndCredentialsCorrect_shouldReturnJwt() {
        when(authSecurityService.normalizeEmail("verified@example.com")).thenReturn("verified@example.com");
        when(authSecurityService.isValidEmail("verified@example.com")).thenReturn(true);

        User verifiedUser = new User("verified@example.com", "hashedPass", "User");
        verifiedUser.setEmailVerified(true);

        when(userRepository.findByEmail("verified@example.com")).thenReturn(Optional.of(verifiedUser));
        when(passwordEncoder.matches("secret123", "hashedPass")).thenReturn(true);
        when(jwtUtils.generateJwtToken("verified@example.com")).thenReturn("mock-valid-jwt");

        AuthRequest req = new AuthRequest("verified@example.com", "secret123");
        ResponseEntity<?> response = authController.login(req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void verifyOtp_withCorrectOtp_shouldActivateAccount() {
        when(authSecurityService.normalizeEmail("user@example.com")).thenReturn("user@example.com");

        User pendingUser = new User("user@example.com", "hashedPass", "User");
        pendingUser.setEmailVerified(false);
        pendingUser.setVerificationOtpHash("hashedOtp123");
        pendingUser.setVerificationOtpExpiry(LocalDateTime.now().plusMinutes(10));
        pendingUser.setVerificationAttempts(0);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pendingUser));
        when(authSecurityService.verifyOtpHash("123456", "hashedOtp123")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(jwtUtils.generateJwtToken("user@example.com")).thenReturn("jwt-activated");

        VerifyOtpRequest req = new VerifyOtpRequest("user@example.com", "123456");
        ResponseEntity<?> response = authController.verifyOtp(req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(pendingUser.isEmailVerified());
        assertNull(pendingUser.getVerificationOtpHash());
    }

    @Test
    void verifyOtp_withIncorrectOtp_shouldIncrementAttempts() {
        when(authSecurityService.normalizeEmail("user@example.com")).thenReturn("user@example.com");

        User pendingUser = new User("user@example.com", "hashedPass", "User");
        pendingUser.setEmailVerified(false);
        pendingUser.setVerificationOtpHash("hashedOtp123");
        pendingUser.setVerificationOtpExpiry(LocalDateTime.now().plusMinutes(10));
        pendingUser.setVerificationAttempts(0);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pendingUser));
        when(authSecurityService.verifyOtpHash("999999", "hashedOtp123")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        VerifyOtpRequest req = new VerifyOtpRequest("user@example.com", "999999");
        ResponseEntity<?> response = authController.verifyOtp(req);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(1, pendingUser.getVerificationAttempts());
        assertFalse(pendingUser.isEmailVerified());
    }
}
