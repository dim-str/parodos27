package com.mageireio.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    @Value("${app.security.jwt.secret}")
    private String jwtSecret;

    @Value("${app.security.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String subject) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(jwtExpirationMs)))
                .signWith(signingKey)
                .compact();
    }

    public boolean isTokenValid(String token, String expectedSubject) {
        try {
            Claims claims = extractAllClaims(token);
            return expectedSubject.equals(claims.getSubject())
                    && claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public String extractSubject(String token) {
        return extractAllClaims(token).getSubject();
    }

    public long getExpirationMs() {
        return jwtExpirationMs;
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
