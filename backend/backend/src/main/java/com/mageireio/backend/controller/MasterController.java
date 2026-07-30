package com.mageireio.backend.controller;

import com.mageireio.backend.model.Store;
import com.mageireio.backend.model.User; // Απαραίτητο για το stream των χρηστών
import com.mageireio.backend.repository.StoreRepository;
import com.mageireio.backend.repository.UserRepository;
import com.mageireio.backend.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/master")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class MasterController {

    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    // Προστέθηκε το UserRepository στον Constructor
    public MasterController(StoreRepository storeRepository, UserRepository userRepository, JwtService jwtService) {
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @GetMapping("/stores")
    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    @GetMapping("/stats")
    public Map<String, Object> getPlatformStats() {
        long totalStores = storeRepository.count();
        return Map.of(
                "totalStores", totalStores,
                "systemStatus", "Healthy",
                "activeConnections", "Live"
        );
    }

    // Το Endpoint για το Impersonate
    @PostMapping("/impersonate/{storeId}")
    public ResponseEntity<?> impersonate(@PathVariable Long storeId) {
        Store store = storeRepository.findById(storeId).orElseThrow();

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "STORE_ADMIN");
        claims.put("storeId", store.getId());

        String storeToken = jwtService.generateToken(claims, "MASTER_ACTING_AS_" + store.getName());

        return ResponseEntity.ok(Map.of("token", storeToken));
    }

    // --- ΝΕΟ ENDPOINT: ΦΕΡΝΕΙ ΟΛΟΥΣ ΤΟΥΣ ΧΡΗΣΤΕΣ (ADMINS & DELIVERY) ---
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                // Δεν εμφανίζουμε τον SUPER_ADMIN στη λίστα των απλών χρηστών
                .filter(u -> !"ROLE_SUPER_ADMIN".equals(u.getRole()))
                .map(u -> new UserResponse(
                        u.getId(),
                        u.getUsername(),
                        u.getFullName(),
                        u.getRole(),
                        u.getStore() != null ? u.getStore().getName() : "Χωρίς Κατάστημα"
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    // --- DTO: ΑΣΦΑΛΗΣ ΜΕΤΑΦΟΡΑ ΔΕΔΟΜΕΝΩΝ (ΧΩΡΙΣ PASSWORDS) ---
    public static class UserResponse {
        private Long id;
        private String username;
        private String fullName;
        private String role;
        private String storeName;

        public UserResponse(Long id, String username, String fullName, String role, String storeName) {
            this.id = id;
            this.username = username;
            this.fullName = fullName;
            this.role = role;
            this.storeName = storeName;
        }

        // Getters
        public Long getId() { return id; }
        public String getUsername() { return username; }
        public String getFullName() { return fullName; }
        public String getRole() { return role; }
        public String getStoreName() { return storeName; }
    }
}