package com.classflow.backendspringboot.auth.passwordreset.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String senderEmail;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from:}") String senderEmail) {
        this.mailSender = mailSender;
        this.senderEmail = senderEmail;
    }

    public void sendResetEmail(String email, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(email);
        message.setSubject("Reset your ClassFlow password");
        message.setText("""
                A password reset was requested for your ClassFlow account.

                Use the link below to choose a new password:
                %s

                This link expires in 15 minutes and can only be used once.
                If you did not request this, you can ignore this email.
                """.formatted(resetLink));
        mailSender.send(message);
    }
}
