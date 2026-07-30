package com.mageireio.backend.controller;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.User;
import com.mageireio.backend.model.OrderStatus;
import com.mageireio.backend.model.OrderItem;
import com.mageireio.backend.model.Dish;
import com.mageireio.backend.repository.OrderRepository;
import com.mageireio.backend.repository.UserRepository;
import com.mageireio.backend.repository.DishRepository;
import com.mageireio.backend.service.OrderService;
import com.mageireio.backend.service.WoltService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.mageireio.backend.service.StripeService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final SimpMessagingTemplate messagingTemplate;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final WoltService woltService;
    private final DishRepository dishRepository; 
    private final StripeService stripeService;
    private final com.mageireio.backend.repository.SettingsRepository settingsRepository;

    public OrderController(
            SimpMessagingTemplate messagingTemplate,
            OrderService orderService,
            OrderRepository orderRepository,
            UserRepository userRepository,
            WoltService woltService,
            DishRepository dishRepository,
            StripeService stripeService,
            com.mageireio.backend.repository.SettingsRepository settingsRepository
    ) {
        this.messagingTemplate = messagingTemplate;
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.woltService = woltService;
        this.dishRepository = dishRepository;
        this.stripeService = stripeService;
        this.settingsRepository = settingsRepository;
    }

    private Long getAuthenticatedStoreId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        Optional<User> userOpt = userRepository.findByUsername(auth.getName());
        if (userOpt.isPresent() && userOpt.get().getStore() != null) {
            return userOpt.get().getStore().getId();
        }
        return null;
    }

    private boolean belongsToStore(CustomerOrder order, Long storeId) {
        return order.getStore() != null
                && order.getStore().getId() != null
                && order.getStore().getId().equals(storeId);
    }

    @GetMapping
    public ResponseEntity<?> getOrders() {
        Long myStoreId = getAuthenticatedStoreId();
        if (myStoreId == null) {
            return ResponseEntity.ok(orderRepository.findAll());
        }

        List<CustomerOrder> myOrders = orderRepository.findByStoreId(myStoreId);
        return ResponseEntity.ok(myOrders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        Long myStoreId = getAuthenticatedStoreId();

        return orderRepository.findById(id)
                .map(order -> (myStoreId == null || belongsToStore(order, myStoreId))
                        ? ResponseEntity.ok(order)
                        : ResponseEntity.status(HttpStatus.FORBIDDEN).build())
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable Long id, @RequestBody CustomerOrder updatedOrder) {
        Long myStoreId = getAuthenticatedStoreId();

        return orderRepository.findById(id).map(order -> {
            if (myStoreId != null && !belongsToStore(order, myStoreId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Ελέγχουμε αν η παραγγελία ΤΩΡΑ αλλάζει σε CANCELLED
            boolean isCancelling = (updatedOrder.getStatus() == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.CANCELLED);

            order.setStatus(updatedOrder.getStatus());
            order.setNotes(updatedOrder.getNotes());
            order.setEstimatedReadyTime(updatedOrder.getEstimatedReadyTime());

            CustomerOrder savedOrder = orderRepository.save(order);

            // --- Αποκατάσταση Μερίδων σε Ακύρωση ---
            if (isCancelling) {
                // 1. --- ΑΥΤΟΜΑΤΟ REFUND STRIPE ---
                if (order.getStripePaymentIntentId() != null && !order.getStripePaymentIntentId().isEmpty()) {
                    com.mageireio.backend.model.StoreSettings settings = settingsRepository.findById(1L).orElse(null);
                    if (settings != null && settings.getStripeSecretKey() != null) {
                        boolean isRefunded = stripeService.refundPayment(order.getStripePaymentIntentId(), settings.getStripeSecretKey());
                        if (isRefunded) {
                            order.setNotes((order.getNotes() != null ? order.getNotes() : "") + " [ΑΥΤΟΜΑΤΟ REFUND ΟΛΟΚΛΗΡΩΘΗΚΕ]");
                        } else {
                            order.setNotes((order.getNotes() != null ? order.getNotes() : "") + " [ΣΦΑΛΜΑ ΑΥΤΟΜΑΤΟΥ REFUND - ΕΛΕΓΞΤΕ ΤΟ STRIPE]");
                        }
                        // Αποθηκεύουμε ξανά για να σωθεί η νέα σημείωση
                        savedOrder = orderRepository.save(order); 
                    }
                }

                // 2. --- ΕΠΙΣΤΡΟΦΗ ΜΕΡΙΔΩΝ (Stock) ---
                if (savedOrder.getItems() != null) {
                    for (OrderItem item : savedOrder.getItems()) {
                        Dish dish = item.getDish();
                        if (dish != null && dish.getAvailablePortions() != null && dish.getAvailablePortions() != -1) {
                            dish.setAvailablePortions(dish.getAvailablePortions() + item.getQuantity());
                            if (!dish.getActive() && dish.getAvailablePortions() > 0) {
                                dish.setActive(true);
                                dish.setDeactivationPolicy("FOREVER");
                            }
                            dishRepository.save(dish);
                        }
                    }
                }
            }

            messagingTemplate.convertAndSend("/topic/orders/" + myStoreId, savedOrder);
            return ResponseEntity.ok(savedOrder);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeOrder(@PathVariable Long id) {
        Long myStoreId = getAuthenticatedStoreId();

        return orderRepository.findById(id).map(order -> {
            if (myStoreId != null && !belongsToStore(order, myStoreId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            orderService.completeOrder(id);
            messagingTemplate.convertAndSend("/topic/orders/" + myStoreId, order);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        Long myStoreId = getAuthenticatedStoreId();

        return orderRepository.findById(id).map(order -> {
            if (myStoreId != null && !belongsToStore(order, myStoreId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            orderRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/call-wolt")
    public ResponseEntity<?> callWoltDelivery(@PathVariable Long id) {
        Long myStoreId = getAuthenticatedStoreId();

        return orderRepository.findById(id).map(order -> {
            if (myStoreId != null && !belongsToStore(order, myStoreId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            try {
                CustomerOrder updatedOrder = woltService.createWoltDelivery(order);
                messagingTemplate.convertAndSend("/topic/orders/" + myStoreId, updatedOrder);
                return ResponseEntity.ok(updatedOrder);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/cancel-wolt")
    public ResponseEntity<?> cancelWoltDelivery(@PathVariable Long id) {
        Long myStoreId = getAuthenticatedStoreId();

        return orderRepository.findById(id).map(order -> {
            if (myStoreId != null && !belongsToStore(order, myStoreId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            try {
                woltService.cancelWoltDelivery(order);
                messagingTemplate.convertAndSend("/topic/orders/" + myStoreId, order);
                return ResponseEntity.ok().build();
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/public/delivery-fee")
    public ResponseEntity<?> calculateDeliveryFee(@RequestBody java.util.Map<String, Object> payload) {
        try {
            Double mockDeliveryFee = 2.50; 
            return ResponseEntity.ok(java.util.Map.of("fee", mockDeliveryFee));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}