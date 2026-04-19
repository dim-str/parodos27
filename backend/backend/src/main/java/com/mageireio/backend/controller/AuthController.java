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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "Invalid credentials - no password sent"));
        }

        // Καθαρίζουμε τυχόν κρυφά κενά (spaces) δεξιά κι αριστερά
        String inputPass = request.password().trim();
        String expectedPass = adminPassword.trim();

        // --- ΜΗΧΑΝΙΣΜΟΣ DEBUGGING (Θα το δεις στα Logs του Render) ---
        System.out.println("===== ΕΛΕΓΧΟΣ LOGIN =====");
        System.out.println("Ο κωδικός που έστειλε το Next.js είναι: [" + inputPass + "]");
        System.out.println("Ο κωδικός που περιμένει η Java είναι:   [" + expectedPass + "]");
        System.out.println("Είναι ολόιδιοι; -> " + inputPass.equals(expectedPass));
        System.out.println("=========================");

        // Απλή σύγκριση για τώρα (το MessageDigest είναι τέλειο, αλλά ας βρούμε το λάθος πρώτα)
        if (!inputPass.equals(expectedPass)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid credentials"));
        }

        String token = jwtService.generateToken(adminUsername);
        // Επιστρέφουμε και το "success": true για να βολευτεί το Next.js
        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", token,
                "type", "Bearer"
        ));
    }
}
