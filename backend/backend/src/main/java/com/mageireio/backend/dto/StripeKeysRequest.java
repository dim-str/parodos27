package com.mageireio.backend.dto;

public class StripeKeysRequest {
    private String publicKey;
    private String secretKey;

    public String getPublicKey() {
        return publicKey;
    }
}