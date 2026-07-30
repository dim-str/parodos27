package com.mageireio.backend.controller;

import com.mageireio.backend.model.*;
import com.mageireio.backend.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    
    private final SettingsRepository settingsRepository;
    private final StoreRepository storeRepository;
    private final DishRepository dishRepository; // Προστέθηκε το DishRepository

    // Προσθέσαμε το DishRepository στον Constructor
    public SettingsController(SettingsRepository settingsRepository, StoreRepository storeRepository, DishRepository dishRepository) {
        this.settingsRepository = settingsRepository;
        this.storeRepository = storeRepository;
        this.dishRepository = dishRepository;
    }

    // Φέρνει τις ρυθμίσεις
    @GetMapping
    public ResponseEntity<StoreSettings> getSettings() {
        // Για τώρα δουλεύουμε με το store_id = 1 για να περάσει το compile!
        StoreSettings settings = settingsRepository.findByStoreId(1L)
                                    .orElse(new StoreSettings());
        return ResponseEntity.ok(settings);
    }

    // Αποθηκεύει τις ρυθμίσεις
    @PutMapping
    public ResponseEntity<StoreSettings> updateSettings(@RequestBody StoreSettings updatedSettings) {
        
        Store store = storeRepository.findById(1L)
                        .orElseThrow(() -> new RuntimeException("Store not found"));

        StoreSettings existingSettings = settingsRepository.findByStoreId(1L)
                                            .orElse(new StoreSettings());

        // --- ΝΕΑ ΛΟΓΙΚΗ ΓΙΑ ΤΑ ΠΙΑΤΑ ΗΜΕΡΑΣ ---
        // Ελέγχουμε αν το μαγαζί ΉΤΑΝ κλειστό και ΤΩΡΑ ανοίγει
        boolean wasClosed = !existingSettings.isOpen();
        boolean isOpeningNow = updatedSettings.isOpen();

        if (wasClosed && isOpeningNow) {
            List<Dish> allDishes = dishRepository.findAll();
            for (Dish dish : allDishes) {
                // Αν είναι κλειστό και η πολιτική είναι "UNTIL_NEXT_OPENING"
                if (!dish.getActive() && "UNTIL_NEXT_OPENING".equals(dish.getDeactivationPolicy())) {
                    dish.setActive(true);
                    dish.setDeactivationPolicy("FOREVER"); // Επαναφορά της πολιτικής
                    dishRepository.save(dish);
                }
            }
            System.out.println("🚀 [ΑΥΤΟΜΑΤΙΣΜΟΣ] Το μαγαζί άνοιξε! Τα επιλεγμένα πιάτα ενεργοποιήθηκαν ξανά.");
        }


        // --------------------------------------

        existingSettings.setGlobalDiscountPercentage(updatedSettings.getGlobalDiscountPercentage());
        existingSettings.setCategoryDiscountName(updatedSettings.getCategoryDiscountName());
        existingSettings.setCategoryDiscountPercentage(updatedSettings.getCategoryDiscountPercentage());

        // Περνάμε τα νέα δεδομένα
        existingSettings.setStore(store);
        existingSettings.setOpen(updatedSettings.isOpen());
        
        // Ωράρια
        existingSettings.setMonday(updatedSettings.getMonday());
        existingSettings.setTuesday(updatedSettings.getTuesday());
        existingSettings.setWednesday(updatedSettings.getWednesday());
        existingSettings.setThursday(updatedSettings.getThursday());
        existingSettings.setFriday(updatedSettings.getFriday());
        existingSettings.setSaturday(updatedSettings.getSaturday());
        existingSettings.setSunday(updatedSettings.getSunday());

        // Extras και Stripe Keys
        existingSettings.setCategoryOrder(updatedSettings.getCategoryOrder());
        existingSettings.setStripePublicKey(updatedSettings.getStripePublicKey());
        existingSettings.setStripeSecretKey(updatedSettings.getStripeSecretKey());

        existingSettings.setWoltMerchantId(updatedSettings.getWoltMerchantId());
        existingSettings.setWoltApiKey(updatedSettings.getWoltApiKey());

        if (updatedSettings.getModifierGroups() != null) {
            existingSettings.getModifierGroups().clear();
            existingSettings.getModifierGroups().addAll(updatedSettings.getModifierGroups());
        }

        existingSettings.setCategoryOrder(updatedSettings.getCategoryOrder());
        existingSettings.setStripePublicKey(updatedSettings.getStripePublicKey());

        existingSettings.setCustomerDeliveryFeePercentage(updatedSettings.getCustomerDeliveryFeePercentage());
        
        existingSettings.setCategoryOrder(updatedSettings.getCategoryOrder());

        existingSettings.setPrimaryColor(updatedSettings.getPrimaryColor());

        // Αποθηκεύουμε
        StoreSettings savedSettings = settingsRepository.save(existingSettings);
        return ResponseEntity.ok(savedSettings);
    }
}