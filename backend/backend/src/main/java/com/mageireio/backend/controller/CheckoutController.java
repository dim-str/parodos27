package com.mageireio.backend.controller;

import com.mageireio.backend.model.*; 
import com.mageireio.backend.repository.*;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/checkout")
@CrossOrigin(origins = "*")
public class CheckoutController {

    private final SettingsRepository settingsRepository;
    private final StoreRepository storeRepository;

    public CheckoutController(SettingsRepository settingsRepository, StoreRepository storeRepository) {
        this.settingsRepository = settingsRepository;
        this.storeRepository = storeRepository;
    }

    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> data) {
        try {
            StoreSettings settings = settingsRepository.findByStoreId(1L)
                                        .orElseThrow(() -> new RuntimeException("Settings not found"));

            Stripe.apiKey = settings.getStripeSecretKey(); 
            
            Double amountDouble = Double.parseDouble(data.get("amount").toString());
            Long amountInCents = Math.round(amountDouble * 100);

            PaymentIntentCreateParams.Builder builder = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("eur")
                .putMetadata("orderId", data.get("orderId").toString())
                .putMetadata("customerName", data.get("customerName").toString());

            // Συνδέουμε τον Πελάτη στο Stripe για να αποθηκεύονται και να εμφανίζονται οι κάρτες του!
            if (data.containsKey("stripeCustomerId") && data.get("stripeCustomerId") != null) {
                String customerId = data.get("stripeCustomerId").toString();
                if (!customerId.trim().isEmpty()) {
                    builder.setCustomer(customerId);
                    // Οδηγία στο Stripe: Αποθήκευσε την κάρτα για μελλοντική χρήση (Vaulting)
                    builder.setSetupFutureUsage(PaymentIntentCreateParams.SetupFutureUsage.ON_SESSION);
                }
            }

            PaymentIntent intent = PaymentIntent.create(builder.build());
            
            Map<String, String> response = new HashMap<>();
            response.put("clientSecret", intent.getClientSecret());
            response.put("publicKey", settings.getStripePublicKey());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Σφάλμα στο Checkout: " + e.getMessage());
            return ResponseEntity.badRequest().body("Σφάλμα Stripe: " + e.getMessage());
        }
    }
}