package com.project.fileserver.controller;

import com.project.fileserver.dto.*;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.UserRepository;
import com.project.fileserver.security.JwtUtils;
import com.project.fileserver.service.AuthSecurityService;
import com.project.fileserver.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User registration, email verification, login, and profile")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuthSecurityService authSecurityService;

    /**
     * Register a new user account with mandatory email verification.
     */
    @PostMapping("/register")
    @Operation(summary = "Register new user account and dispatch verification email")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        String normalizedEmail = authSecurityService.normalizeEmail(request.getEmail());

        if (!authSecurityService.isValidEmail(normalizedEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter a valid email address."));
        }

        if (request.getName() == null || request.getName().trim().length() < 2) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter your full name (at least 2 characters)."));
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters long."));
        }

        Optional<User> existingUserOpt = userRepository.findByEmail(normalizedEmail);
        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            if (existing.isEmailVerified()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "This email address is already registered. Please sign in."
                ));
            } else {
                // Account exists but is unverified - allow re-registration / refresh verification code
                existing.setName(request.getName().trim());
                existing.setPasswordHash(encoder.encode(request.getPassword()));

                // Cooldown check
                if (existing.getLastVerificationSentAt() != null) {
                    long secondsSinceLast = Duration.between(existing.getLastVerificationSentAt(), LocalDateTime.now()).getSeconds();
                    if (secondsSinceLast < 60) {
                        long wait = 60 - secondsSinceLast;
                        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                                "message", "A verification email was recently sent. Please wait " + wait + " seconds before requesting another.",
                                "email", normalizedEmail,
                                "requiresVerification", true,
                                "cooldownSeconds", wait
                        ));
                    }
                }

                String otp = authSecurityService.generateSecureOtp();
                String token = authSecurityService.generateVerificationToken();
                existing.setVerificationOtpHash(authSecurityService.hashOtp(otp));
                existing.setVerificationToken(token);
                existing.setVerificationOtpExpiry(LocalDateTime.now().plusMinutes(15));
                existing.setVerificationAttempts(0);
                existing.setLastVerificationSentAt(LocalDateTime.now());
                existing.setUpdatedAt(LocalDateTime.now());

                userRepository.save(existing);
                emailService.sendVerificationEmail(existing.getEmail(), existing.getName(), otp, token);

                return ResponseEntity.ok(Map.of(
                        "message", "A verification code has been sent to your email. Please verify to activate your account.",
                        "email", normalizedEmail,
                        "requiresVerification", true
                ));
            }
        }

        // Create new pending/unverified user
        User user = new User(
                normalizedEmail,
                encoder.encode(request.getPassword()),
                request.getName().trim()
        );
        user.setEmailVerified(false);

        String otp = authSecurityService.generateSecureOtp();
        String token = authSecurityService.generateVerificationToken();
        user.setVerificationOtpHash(authSecurityService.hashOtp(otp));
        user.setVerificationToken(token);
        user.setVerificationOtpExpiry(LocalDateTime.now().plusMinutes(15));
        user.setVerificationAttempts(0);
        user.setLastVerificationSentAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        emailService.sendVerificationEmail(saved.getEmail(), saved.getName(), otp, token);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Account registered! A verification code has been sent to your email.",
                "email", normalizedEmail,
                "requiresVerification", true
        ));
    }

    /**
     * Verify email via 6-digit OTP code.
     */
    @PostMapping("/verify-otp")
    @Operation(summary = "Verify account email using 6-digit OTP")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String normalizedEmail = authSecurityService.normalizeEmail(request.getEmail());

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "message", "No account found with this email address."
            ));
        }

        User user = userOpt.get();

        if (user.isEmailVerified()) {
            String jwt = jwtUtils.generateJwtToken(user.getEmail());
            return ResponseEntity.ok(Map.of(
                    "message", "Account is already verified. You are now signed in.",
                    "token", jwt,
                    "user", new AuthResponse.UserDto(user),
                    "emailVerified", true
            ));
        }

        // Brute force protection: max 5 failed attempts per OTP
        if (user.getVerificationAttempts() >= 5) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Too many failed attempts. This code has been invalidated. Please request a new verification code."
            ));
        }

        // Expiration check (15 minutes)
        if (user.getVerificationOtpExpiry() == null || user.getVerificationOtpExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Verification code has expired. Please request a new one."
            ));
        }

        // Verify OTP against stored cryptographic hash
        boolean matches = authSecurityService.verifyOtpHash(request.getOtp(), user.getVerificationOtpHash());
        if (!matches) {
            int newAttempts = user.getVerificationAttempts() + 1;
            user.setVerificationAttempts(newAttempts);
            if (newAttempts >= 5) {
                user.setVerificationOtpExpiry(LocalDateTime.now()); // Invalidate OTP
            }
            userRepository.save(user);

            int remaining = Math.max(0, 5 - newAttempts);
            return ResponseEntity.badRequest().body(Map.of(
                    "message", remaining > 0
                            ? "Invalid verification code. " + remaining + " attempts remaining."
                            : "Too many failed attempts. This code has been invalidated. Please request a new code."
            ));
        }

        // Successful verification!
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        user.setVerificationOtpHash(null);
        user.setVerificationToken(null);
        user.setVerificationOtpExpiry(null);
        user.setVerificationAttempts(0);
        user.setUpdatedAt(LocalDateTime.now());

        User verifiedUser = userRepository.save(user);
        String jwt = jwtUtils.generateJwtToken(verifiedUser.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email verified successfully! Welcome to CloudVault.");
        response.put("token", jwt);
        response.put("user", new AuthResponse.UserDto(verifiedUser));
        response.put("emailVerified", true);

        return ResponseEntity.ok(response);
    }

    /**
     * Verify email via one-click secure verification link token.
     */
    @GetMapping("/verify-link")
    @Operation(summary = "Verify account email using secure single-use link token")
    public ResponseEntity<?> verifyLink(@RequestParam("token") String token) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Verification token is required."));
        }

        Optional<User> userOpt = userRepository.findByVerificationToken(token.trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or already used verification link."));
        }

        User user = userOpt.get();

        if (user.getVerificationOtpExpiry() == null || user.getVerificationOtpExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Verification link has expired. Please sign in to request a new link."));
        }

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        user.setVerificationOtpHash(null);
        user.setVerificationToken(null);
        user.setVerificationOtpExpiry(null);
        user.setVerificationAttempts(0);
        user.setUpdatedAt(LocalDateTime.now());

        User verifiedUser = userRepository.save(user);
        String jwt = jwtUtils.generateJwtToken(verifiedUser.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email verified successfully! Welcome to CloudVault.");
        response.put("token", jwt);
        response.put("user", new AuthResponse.UserDto(verifiedUser));
        response.put("emailVerified", true);

        return ResponseEntity.ok(response);
    }

    /**
     * Resend verification email with cooldown rate limiting.
     */
    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification code with rate limiting")
    public ResponseEntity<?> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        String normalizedEmail = authSecurityService.normalizeEmail(request.getEmail());

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "message", "No account found with this email address."
            ));
        }

        User user = userOpt.get();

        if (user.isEmailVerified()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Your account is already verified. Please sign in."
            ));
        }

        // 60-second cooldown rate limit
        if (user.getLastVerificationSentAt() != null) {
            long secondsSinceLast = Duration.between(user.getLastVerificationSentAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceLast < 60) {
                long wait = 60 - secondsSinceLast;
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "message", "Please wait " + wait + " seconds before requesting another verification code.",
                        "cooldownSeconds", wait
                ));
            }
        }

        String otp = authSecurityService.generateSecureOtp();
        String token = authSecurityService.generateVerificationToken();
        user.setVerificationOtpHash(authSecurityService.hashOtp(otp));
        user.setVerificationToken(token);
        user.setVerificationOtpExpiry(LocalDateTime.now().plusMinutes(15));
        user.setVerificationAttempts(0);
        user.setLastVerificationSentAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), otp, token);

        return ResponseEntity.ok(Map.of(
                "message", "A new verification code has been sent to your email.",
                "email", normalizedEmail,
                "cooldownSeconds", 60
        ));
    }

    /**
     * Authenticate user with strict verification check and BCrypt password validation.
     */
    @PostMapping("/login")
    @Operation(summary = "Authenticate user and issue JWT token (FR-02)")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        String normalizedEmail = authSecurityService.normalizeEmail(request.getEmail());

        if (!authSecurityService.isValidEmail(normalizedEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter a valid email address."));
        }

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Invalid email or password."
            ));
        }

        User user = userOpt.get();

        // BCrypt Password validation
        if (!encoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Invalid email or password."
            ));
        }

        // Check whether email has been verified
        if (!user.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Please verify your email before signing in.",
                    "errorCode", "EMAIL_NOT_VERIFIED",
                    "email", user.getEmail()
            ));
        }

        // Authenticated and verified! Issue JWT token
        String jwt = jwtUtils.generateJwtToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(jwt, user));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<?> getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(new AuthResponse.UserDto(user));
    }
}

