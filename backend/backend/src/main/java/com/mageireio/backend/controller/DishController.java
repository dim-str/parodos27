package com.mageireio.backend.controller;

import com.mageireio.backend.config.CloudinaryConfig;
import com.mageireio.backend.model.ComboItem;
import com.mageireio.backend.model.Dish;
import com.mageireio.backend.model.Store;
import com.mageireio.backend.model.User;
import com.mageireio.backend.repository.DishRepository;
import com.mageireio.backend.repository.StoreRepository;
import com.mageireio.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/dishes")
public class DishController {

    private final DishRepository dishRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final CloudinaryConfig.ImageService imageService;

    public DishController(
            DishRepository dishRepository,
            StoreRepository storeRepository,
            UserRepository userRepository,
            CloudinaryConfig.ImageService imageService
    ) {
        this.dishRepository = dishRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.imageService = imageService;
    }

    private Long getAuthenticatedStoreId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;

        Optional<User> userOpt = userRepository.findByUsername(auth.getName());
        if (userOpt.isPresent() && userOpt.get().getStore() != null) {
            return userOpt.get().getStore().getId();
        }
        return null;
    }

    @GetMapping
    public List<Dish> getAllDishes() {
        Long storeId = getAuthenticatedStoreId();
        if (storeId == null) {
            return dishRepository.findAll();
        }
        return dishRepository.findByStoreId(storeId);
    }

    @GetMapping("/active")
    public List<Dish> getActiveDishes() {
        Long storeId = getAuthenticatedStoreId();
        if (storeId != null) {
            return dishRepository.findByStoreIdAndActiveTrue(storeId);
        }
        return dishRepository.findByActiveTrue();
    }

    @PostMapping
    public ResponseEntity<?> addDish(@RequestBody Dish dish) {
        if (dish.getStore() == null || dish.getStore().getId() == null) {
            Long storeId = getAuthenticatedStoreId();
            if (storeId != null) {
                Store store = storeRepository.findById(storeId).orElse(null);
                dish.setStore(store);
            }
        }

        if (dish.getStore() == null || dish.getStore().getId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Dish must be linked to a store.");
        }

        // Φροντίζουμε τα Combo Items να βρουν τα πραγματικά πιάτα από τη βάση
        if (dish.getComboItems() != null) {
            for (ComboItem ci : dish.getComboItems()) {
                ci.setCombo(dish);
                if (ci.getDish() != null && ci.getDish().getId() != null) {
                    Dish realInnerDish = dishRepository.findById(ci.getDish().getId()).orElse(null);
                    ci.setDish(realInnerDish);
                }
            }
        }

        return ResponseEntity.ok(dishRepository.save(dish));
    }

    @PatchMapping("/{id}/toggle")
    public Dish toggleActive(@PathVariable Long id, @RequestParam boolean status) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dish not found"));
        dish.setActive(status);
        return dishRepository.save(dish);
    }

    @PutMapping("/{id}")
    public Dish updateDish(@PathVariable Long id, @RequestBody Dish updatedDish) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dish not found"));

        if (dish.getStore() == null || dish.getStore().getId() == null) {
            Long storeId = getAuthenticatedStoreId();
            if (storeId != null) {
                Store store = storeRepository.findById(storeId).orElse(null);
                dish.setStore(store);
            }
        }

        dish.setName(updatedDish.getName());
        dish.setPrice(updatedDish.getPrice());
        dish.setCategory(updatedDish.getCategory());
        dish.setExtras(updatedDish.getExtras());
        dish.setDescription(updatedDish.getDescription());
        dish.setImageUrl(updatedDish.getImageUrl());
        dish.setAvailablePortions(updatedDish.getAvailablePortions());
        dish.setActive(updatedDish.getActive());

        if (updatedDish.getIsQuickItem() != null) {
            dish.setIsQuickItem(updatedDish.getIsQuickItem());
        } else {
            dish.setIsQuickItem(false);
        }

        if (updatedDish.getIsCombo() != null) {
            dish.setIsCombo(updatedDish.getIsCombo());
        } else {
            dish.setIsCombo(false);
        }
        
        dish.setOriginalPrice(updatedDish.getOriginalPrice());

        // --- Η ΛΥΣΗ ΓΙΑ ΤΑ COMBO DEALS ---
        // Διαγράφουμε τα παλιά Combo Items και βάζουμε τα καινούργια
        dish.getComboItems().clear();
        if (updatedDish.getComboItems() != null) {
            for (ComboItem ci : updatedDish.getComboItems()) {
                ci.setCombo(dish);
                // Πρέπει να δέσουμε το Item με το ΠΡΑΓΜΑΤΙΚΟ πιάτο της βάσης (όχι απλά με ένα αντικείμενο που ήρθε από το JSON)
                if (ci.getDish() != null && ci.getDish().getId() != null) {
                    Dish realInnerDish = dishRepository.findById(ci.getDish().getId()).orElse(null);
                    ci.setDish(realInnerDish);
                }
                dish.getComboItems().add(ci);
            }
        }

        return dishRepository.save(dish);
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<String> uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = imageService.uploadImage(file);
            Dish dish = dishRepository.findById(id).orElseThrow();
            dish.setImageUrl(imageUrl);
            dishRepository.save(dish);
            return ResponseEntity.ok(imageUrl);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed");
        }
    }
}