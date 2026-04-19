package com.mageireio.backend.controller;

import com.mageireio.backend.dto.AuthResponse;
import com.mageireio.backend.dto.LoginRequest;
import com.mageireio.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${app.security.admin.username:admin}")
    private String adminUsername;

    @Value("${app.security.admin.password}")
    private String adminPassword;

    private final JwtService jwtService;

    public AuthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request == null || request.password() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
        }

        boolean passwordMatches = MessageDigest.isEqual(
                request.password().trim().getBytes(StandardCharsets.UTF_8),
                adminPassword.trim().getBytes(StandardCharsets.UTF_8)
        );

        if (!passwordMatches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
        }

        String token = jwtService.generateToken(adminUsername);
        return ResponseEntity.ok(new AuthResponse(token, "Bearer", jwtService.getExpirationMs()));
    }
}
