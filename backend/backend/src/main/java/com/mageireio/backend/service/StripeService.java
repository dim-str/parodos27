package com.mageireio.backend.service;

import com.stripe.Stripe;
import com.stripe.model.Refund;
import com.stripe.param.RefundCreateParams;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    public boolean refundPayment(String paymentIntentId, String stripeSecretKey) {
        if (paymentIntentId == null || paymentIntentId.isEmpty() || stripeSecretKey == null || stripeSecretKey.isEmpty()) {
            return false;
        }

        try {
            // Βάζουμε το μυστικό κλειδί του καταστήματος
            Stripe.apiKey = stripeSecretKey;

            // Δημιουργούμε την εντολή επιστροφής
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentId)
                    .build();

            // Στέλνουμε την εντολή στο Stripe
            Refund.create(params);
            
            System.out.println("✅ Επιτυχές αυτόματο Refund για το: " + paymentIntentId);
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ Σφάλμα κατά το refund στο Stripe: " + e.getMessage());
            return false;
        }
    }
}