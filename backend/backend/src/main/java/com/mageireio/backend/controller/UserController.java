package com.mageireio.backend.controller;

import com.mageireio.backend.model.AppUser;
import com.mageireio.backend.model.Address;
import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.StoreSettings;
import com.mageireio.backend.repository.AppUserRepository;
import com.mageireio.backend.repository.AddressRepository;
import com.mageireio.backend.repository.OrderRepository;
import com.mageireio.backend.repository.SettingsRepository;
import com.stripe.Stripe;
import com.stripe.model.Customer;
import com.stripe.param.CustomerCreateParams;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final AppUserRepository userRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final SettingsRepository settingsRepository;

    public UserController(AppUserRepository userRepository, AddressRepository addressRepository, OrderRepository orderRepository, SettingsRepository settingsRepository) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.orderRepository = orderRepository;
        this.settingsRepository = settingsRepository;
    }

    @PostMapping("/sync")
    public ResponseEntity<AppUser> syncUser(@RequestBody Map<String, String> payload) {
        String uid = payload.get("firebaseUid");
        String email = payload.get("email");
        String name = payload.get("name");

        StoreSettings settings = settingsRepository.findByStoreId(1L).orElse(new StoreSettings());
        if (settings.getStripeSecretKey() != null && !settings.getStripeSecretKey().isEmpty()) {
            Stripe.apiKey = settings.getStripeSecretKey();
        }

        AppUser user = userRepository.findByFirebaseUid(uid).orElseGet(() -> {
            AppUser newUser = new AppUser();
            newUser.setFirebaseUid(uid);
            newUser.setEmail(email);
            newUser.setFullName(name);
            
            // Αυτόματη Δημιουργία Stripe Customer
            if (Stripe.apiKey != null) {
                try {
                    CustomerCreateParams params = CustomerCreateParams.builder()
                            .setEmail(email)
                            .setName(name)
                            .build();
                    Customer stripeCustomer = Customer.create(params);
                    newUser.setStripeCustomerId(stripeCustomer.getId());
                } catch (Exception e) {
                    System.err.println("Σφάλμα δημιουργίας Stripe Customer: " + e.getMessage());
                }
            }
            return userRepository.save(newUser);
        });

        // Αν ο παλιός χρήστης δεν έχει Stripe ID, του φτιάχνουμε ένα τώρα
        if (user.getStripeCustomerId() == null && Stripe.apiKey != null) {
            try {
                CustomerCreateParams params = CustomerCreateParams.builder()
                        .setEmail(user.getEmail())
                        .setName(user.getFullName())
                        .build();
                Customer stripeCustomer = Customer.create(params);
                user.setStripeCustomerId(stripeCustomer.getId());
                user = userRepository.save(user);
            } catch (Exception e) {
                System.err.println("Σφάλμα αναβάθμισης Stripe Customer: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(user);
    }

    @GetMapping("/{uid}")
    public ResponseEntity<AppUser> getUserProfile(@PathVariable String uid) {
        return userRepository.findByFirebaseUid(uid)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{uid}")
    public ResponseEntity<AppUser> updateProfile(@PathVariable String uid, @RequestBody AppUser updatedData) {
        return userRepository.findByFirebaseUid(uid).map(user -> {
            if (updatedData.getFullName() != null) user.setFullName(updatedData.getFullName());
            if (updatedData.getPhone() != null) user.setPhone(updatedData.getPhone());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{uid}/orders")
    public ResponseEntity<List<CustomerOrder>> getUserOrders(@PathVariable String uid) {
        List<CustomerOrder> orders = orderRepository.findByUser_FirebaseUidOrderByIdDesc(uid);
        return ResponseEntity.ok(orders);
    }

    // ΝΕΟ: Επιστρέφει τις αποθηκευμένες διευθύνσεις του χρήστη
    @GetMapping("/{uid}/addresses")
    public ResponseEntity<List<Address>> getAddresses(@PathVariable String uid) {
        return userRepository.findByFirebaseUid(uid).map(user -> {
            return ResponseEntity.ok(addressRepository.findByUserId(user.getId()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{uid}/addresses")
    public ResponseEntity<Address> addAddress(@PathVariable String uid, @RequestBody Address address) {
        return userRepository.findByFirebaseUid(uid).map(user -> {
            address.setUser(user);
            Address saved = addressRepository.save(address);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{uid}/addresses/{addressId}")
    public ResponseEntity<?> deleteAddress(@PathVariable String uid, @PathVariable Long addressId) {
        return addressRepository.findById(addressId).map(address -> {
            if (address.getUser().getFirebaseUid().equals(uid)) {
                addressRepository.delete(address);
                return ResponseEntity.ok(Map.of("message", "Η διεύθυνση διαγράφηκε"));
            }
            return ResponseEntity.status(403).build();
        }).orElse(ResponseEntity.notFound().build());
    }
}