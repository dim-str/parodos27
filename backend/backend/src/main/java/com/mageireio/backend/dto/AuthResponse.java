package com.mageireio.backend.dto;

public record AuthResponse(String token, String tokenType, long expiresInMs) {
}
