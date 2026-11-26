package com.project.fileserver.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.mail.from:noreply@cloudvault.app}")
    private String fromAddress;

    @Value("${app.mail.sender-name:CloudVault}")
    private String senderName;

    @Value("${app.frontend-url:https://cloud-based-file-storage-system-delta.vercel.app}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${BREVO_API_KEY:${app.mail.brevo-api-key:}}")
    private String brevoApiKey;

    @Value("${RESEND_API_KEY:${app.mail.resend-api-key:}}")
    private String resendApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    /**
     * Dispatch verification email asynchronously so signup/resend HTTP requests never block on external mail APIs.
     *
     * @param toEmail recipient email address
     * @param userName recipient display name
     * @param otp 6-digit one-time password
     * @param verificationToken secure single-use token for one-click verification link
     */
    @Async("emailTaskExecutor")
    public void sendVerificationEmail(String toEmail, String userName, String otp, String verificationToken) {
        try {
            sendVerificationEmailSync(toEmail, userName, otp, verificationToken);
        } catch (Exception e) {
            logger.error("Unexpected async error while dispatching verification email to {}: {}", maskEmail(toEmail), e.getMessage());
        }
    }

    boolean sendVerificationEmailSync(String toEmail, String userName, String otp, String verificationToken) {
        String verificationLink = frontendUrl + "/?verifyToken=" + verificationToken;
        String subject = "Verify your CloudVault account";
        String htmlContent = buildHtmlVerificationEmail(userName, otp, verificationLink);
        String plainText = buildPlainTextVerificationEmail(userName, otp, verificationLink);

        // Log verification dispatch details for server-side debugging
        logger.info("[OTP VERIFICATION DISPATCH] Recipient: {}, Activation Link ready", maskEmail(toEmail));

        // 1. Try Brevo HTTPS API (Port 443 - never blocked on cloud platforms)
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            String senderEmail = (fromAddress != null && fromAddress.contains("@") && !fromAddress.contains("noreply@cloudvault.app"))
                    ? fromAddress : (smtpUsername != null && smtpUsername.contains("@") ? smtpUsername : "noreply@cloudvault.app");
            Map<String, Object> brevoPayload = Map.of(
                    "sender", Map.of("name", senderName, "email", senderEmail),
                    "replyTo", Map.of("name", senderName, "email", senderEmail),
                    "to", List.of(Map.of("email", toEmail, "name", userName != null ? userName : "User")),
                    "subject", subject,
                    "textContent", plainText,
                    "htmlContent", htmlContent
            );
            if (sendViaHttpsApi("Brevo", "https://api.brevo.com/v3/smtp/email", "api-key", brevoApiKey.trim(), brevoPayload, toEmail)) {
                return true;
            }
        }

        // 2. Try Resend HTTPS API (Port 443 - never blocked on cloud platforms)
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            String senderEmail = (fromAddress != null && fromAddress.contains("@") && !fromAddress.contains("noreply@cloudvault.app"))
                    ? fromAddress : (smtpUsername != null && smtpUsername.contains("@") ? smtpUsername : "noreply@cloudvault.app");
            Map<String, Object> resendPayload = Map.of(
                    "from", senderName + " <onboarding@resend.dev>",
                    "reply_to", senderEmail,
                    "to", List.of(toEmail),
                    "subject", subject,
                    "text", plainText,
                    "html", htmlContent
            );
            if (sendViaHttpsApi("Resend", "https://api.resend.com/emails", "Authorization", "Bearer " + resendApiKey.trim(), resendPayload, toEmail)) {
                return true;
            }
        }

        // 3. Fallback to JavaMailSender SMTP (Port 587)
        if (mailSender == null || smtpUsername == null || smtpUsername.isBlank()) {
            logger.warn("SMTP mail sender is not configured (SPRING_MAIL_USERNAME is empty). Verification code for {} was stored in database.", toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromAddress, senderName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(plainText, htmlContent);

            mailSender.send(message);
            logger.info("Verification email successfully dispatched to recipient: {}", maskEmail(toEmail));
            return true;
        } catch (MessagingException | MailException e) {
            logger.error("Failed to deliver verification email via SMTP to: {}. Error: {}", maskEmail(toEmail), e.getMessage());
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error while sending verification email to recipient: {}", maskEmail(toEmail), e);
            return false;
        }
    }

    private boolean sendViaHttpsApi(
            String providerName,
            String endpoint,
            String authHeaderName,
            String authHeaderValue,
            Map<String, Object> payload,
            String toEmail
    ) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header(authHeaderName, authHeaderValue)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Email dispatched successfully via {} HTTPS API to {}", providerName, maskEmail(toEmail));
                return true;
            }
            logger.warn("{} API responded with status {}: {}", providerName, response.statusCode(), response.body());
            return false;
        } catch (Exception e) {
            logger.error("Failed to send email via {} HTTPS API: {}", providerName, e.getMessage());
            return false;
        }
    }

    private String buildHtmlVerificationEmail(String userName, String otp, String verificationLink) {
        String safeName = escapeHtml((userName != null && !userName.isBlank()) ? userName.trim() : "there");

        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<meta charset='UTF-8'>"
                + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "<title>Verify your CloudVault account</title>"
                + "</head>"
                + "<body style='margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;color:#1e293b;'>"
                + "<table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0' style='background-color:#f8fafc;padding:32px 16px;'>"
                + "<tr><td align='center'>"
                + "<table role='presentation' width='100%' style='max-width:520px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;' cellspacing='0' cellpadding='0' border='0'>"
                + "<tr>"
                + "<td style='background-color:#4f46e5;padding:24px 32px;text-align:left;'>"
                + "<h1 style='margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;'>CloudVault</h1>"
                + "<p style='margin:4px 0 0 0;color:#e0e7ff;font-size:12px;'>Account Email Verification</p>"
                + "</td>"
                + "</tr>"
                + "<tr>"
                + "<td style='padding:28px 32px;'>"
                + "<p style='margin:0 0 16px 0;color:#0f172a;font-size:15px;font-weight:600;'>Hi " + safeName + ",</p>"
                + "<p style='margin:0 0 20px 0;color:#475569;font-size:14px;line-height:1.6;'>"
                + "Use this 6-digit verification code to finish setting up your CloudVault account. The code expires in 15 minutes and works once."
                + "</p>"
                + "<div style='background-color:#f1f5f9;border-radius:12px;padding:18px;text-align:center;margin-bottom:24px;'>"
                + "<div style='font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#4f46e5;padding-left:8px;'>"
                + otp
                + "</div>"
                + "</div>"
                + "<p style='margin:0 0 16px 0;color:#475569;font-size:14px;line-height:1.6;'>"
                + "Or verify directly with the button below:"
                + "</p>"
                + "<div style='margin-bottom:24px;'>"
                + "<a href='" + verificationLink + "' style='display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;'>Verify Email Address</a>"
                + "</div>"
                + "<p style='margin:0;color:#64748b;font-size:12px;line-height:1.5;'>"
                + "If you did not sign up for CloudVault, you can safely ignore this message."
                + "</p>"
                + "</td>"
                + "</tr>"
                + "<tr>"
                + "<td style='background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;'>"
                + "<p style='margin:0;color:#94a3b8;font-size:11px;'>CloudVault Document Management System - BIT Mesra</p>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</td></tr>"
                + "</table>"
                + "</body>"
                + "</html>";
    }

    private String buildPlainTextVerificationEmail(String userName, String otp, String verificationLink) {
        String safeName = (userName != null && !userName.isBlank()) ? userName.trim() : "there";
        return "Hi " + safeName + ",\n\n"
                + "Thank you for registering with CloudVault.\n\n"
                + "Your 6-digit verification code is: " + otp + "\n"
                + "This code expires in 15 minutes and can only be used once.\n\n"
                + "Alternatively, open this link to verify your account:\n"
                + verificationLink + "\n\n"
                + "If you did not create a CloudVault account, please disregard this message.\n\n"
                + "Regards,\nCloudVault Team";
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIndex = email.indexOf("@");
        String name = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        if (name.length() <= 2) {
            return name.charAt(0) + "***" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + domain;
    }
}
