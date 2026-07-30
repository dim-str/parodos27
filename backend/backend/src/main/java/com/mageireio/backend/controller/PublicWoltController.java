package com.mageireio.backend.controller;

import com.mageireio.backend.model.Store;
import com.mageireio.backend.model.StoreSettings;
import com.mageireio.backend.repository.StoreRepository;
import com.mageireio.backend.repository.StoreSettingsRepository;
import com.mageireio.backend.service.WoltService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/wolt")
public class PublicWoltController {

    private final WoltService woltService;
    private final StoreSettingsRepository storeSettingsRepository;
    private final StoreRepository storeRepository;

    public PublicWoltController(WoltService woltService, StoreSettingsRepository storeSettingsRepository, StoreRepository storeRepository) {
        this.woltService = woltService;
        this.storeSettingsRepository = storeSettingsRepository;
        this.storeRepository = storeRepository;
    }

    @PostMapping("/delivery-fee")
    public ResponseEntity<?> calculateDeliveryFee(@RequestBody Map<String, Object> payload) {
        try {
            // Παίρνουμε τα δεδομένα από το Frontend
            String storeSlug = (String) payload.get("storeSlug");
            Double lat = Double.valueOf(payload.get("lat").toString());
            Double lng = Double.valueOf(payload.get("lng").toString());
            String address = (String) payload.get("address");

            // Βρίσκουμε το Μαγαζί & τις Ρυθμίσεις του (για να πάρουμε το σωστό Wolt API Key)
            Store store = storeRepository.findBySlug(storeSlug)
                    .orElseThrow(() -> new RuntimeException("Το κατάστημα δεν βρέθηκε"));
                    
            StoreSettings settings = storeSettingsRepository.findByStoreId(store.getId())
                    .orElseThrow(() -> new RuntimeException("Οι ρυθμίσεις του καταστήματος δεν βρέθηκαν"));

            // Ρωτάμε τη Wolt για το πραγματικό κόστος
            Double fee = woltService.getDeliveryFee(lat, lng, address, settings);
            
            return ResponseEntity.ok(Map.of("fee", fee));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}