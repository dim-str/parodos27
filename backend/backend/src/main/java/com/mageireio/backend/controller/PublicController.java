package com.mageireio.backend.controller;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.Dish;
import com.mageireio.backend.model.OrderStatus;
import com.mageireio.backend.repository.DishRepository;
import com.mageireio.backend.repository.OrderRepository;
import com.mageireio.backend.repository.StoreRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import com.mageireio.backend.dto.OrderRequestDTO;
import com.mageireio.backend.model.OrderItem;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final DishRepository dishRepository;
    private final StoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final com.mageireio.backend.repository.SettingsRepository settingsRepository;

    public PublicController(
            DishRepository dishRepository,
            StoreRepository storeRepository,
            OrderRepository orderRepository,
            com.mageireio.backend.repository.SettingsRepository settingsRepository
    ) {
        this.dishRepository = dishRepository;
        this.storeRepository = storeRepository;
        this.orderRepository = orderRepository;
        this.settingsRepository = settingsRepository;
    }

    @GetMapping("/store/{storeSlug}/dishes")
    public ResponseEntity<?> getStoreDishes(@PathVariable String storeSlug) {
        return storeRepository.findBySlug(storeSlug)
                .<ResponseEntity<?>>map(store -> {
                    List<Dish> dishes = dishRepository.findByStoreIdAndActiveTrue(store.getId());
                    return ResponseEntity.ok(dishes);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/store/{storeSlug}/settings")
    public ResponseEntity<?> getStoreSettings(@PathVariable String storeSlug) {
        return storeRepository.findBySlug(storeSlug)
                .<ResponseEntity<?>>map(store -> {
                    com.mageireio.backend.model.StoreSettings settings = settingsRepository.findById(1L).orElse(new com.mageireio.backend.model.StoreSettings());
                    Map<String, Object> response = new java.util.HashMap<>();
                    response.put("open", settings.isOpen());
                    response.put("address", store.getAddress() != null ? store.getAddress() : "Unknown address");
                    response.put("phone", store.getPhone() != null ? store.getPhone() : "Unknown phone");
                    response.put("storeName", store.getName());
                    response.put("storeSlug", store.getSlug());
                    response.put("categoryOrder", settings.getCategoryOrder());
                    
                    response.put("modifierGroups", settings.getModifierGroups());

                    response.put("monday", settings.getMonday());
                    response.put("tuesday", settings.getTuesday());
                    response.put("wednesday", settings.getWednesday());
                    response.put("thursday", settings.getThursday());
                    response.put("friday", settings.getFriday());
                    response.put("saturday", settings.getSaturday());
                    response.put("sunday", settings.getSunday());

                    response.put("globalDiscountPercentage", settings.getGlobalDiscountPercentage());
                    response.put("categoryDiscountName", settings.getCategoryDiscountName());
                    response.put("categoryDiscountPercentage", settings.getCategoryDiscountPercentage());

                    response.put("primaryColor", settings.getPrimaryColor());
                    
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/store/{storeSlug}/orders")
    public ResponseEntity<?> placeOrder(@PathVariable String storeSlug, @RequestBody OrderRequestDTO request) {
        return storeRepository.findBySlug(storeSlug)
            .<ResponseEntity<?>>map(store -> {
                CustomerOrder order = new CustomerOrder();
                order.setStore(store);
                order.setCustomerName(request.getCustomerName());
                order.setPhone(request.getPhone());
                order.setAddress(request.getAddress());
                order.setOrderType(request.getOrderType());
                order.setStatus(OrderStatus.PENDING);
                
                order.setNotes("ΠΛΗΡΩΜΗ: " + request.getPaymentMethod() + " | " + (request.getNotes() != null ? request.getNotes() : ""));

                java.util.List<OrderItem> orderItems = new java.util.ArrayList<>();
                for (OrderRequestDTO.ItemDTO itemDto : request.getCartItems()) {
                    Dish dish = dishRepository.findById(itemDto.getDishId()).orElse(null);
                    if (dish != null) {
                        OrderItem item = new OrderItem();
                        item.setDish(dish);
                        item.setQuantity(itemDto.getQuantity());
                        item.setExtras(itemDto.getExtras());
                        orderItems.add(item);

                        // --- ΝΕΟ: Αυτόματη μείωση διαθέσιμων μερίδων & Απενεργοποίηση ---
                        if (dish.getAvailablePortions() != null && dish.getAvailablePortions() > 0) {
                            int newPortions = dish.getAvailablePortions() - itemDto.getQuantity();
                            dish.setAvailablePortions(Math.max(0, newPortions)); 
                            
                            // Αν το απόθεμα μηδενιστεί, απενεργοποιούμε το πιάτο 
                            if (newPortions <= 0) {
                                dish.setActive(false);
                                dish.setDeactivationPolicy("UNTIL_NEXT_OPENING");
                            }
                            
                            dishRepository.save(dish);
                        }
                    }
                }
                
                order.setItems(orderItems);
                CustomerOrder savedOrder = orderRepository.save(order);
                
                if ("ΜΕΤΡΗΤΑ".equals(request.getPaymentMethod())) {
                    CustomerOrder fullOrder = orderRepository.findById(savedOrder.getId()).orElse(savedOrder);
                    messagingTemplate.convertAndSend("/topic/orders/" + store.getId(), fullOrder);
                }
                
                return ResponseEntity.ok(Map.of(
                        "message", "Order placed successfully.",
                        "orderId", savedOrder.getTrackingCode(),
                        "databaseId", savedOrder.getId()
                ));
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/store/{storeSlug}/orders/{trackingCode}/confirm")
    public ResponseEntity<?> confirmPayment(@PathVariable String storeSlug, @PathVariable String trackingCode) {
        return orderRepository.findByTrackingCode(trackingCode)
                .map(order -> {
                    if (order.getStore() != null) {
                        messagingTemplate.convertAndSend("/topic/orders/" + order.getStore().getId(), order);
                    }
                    
                    return ResponseEntity.ok(Map.of("status", "success"));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/orders/track/{trackingCode}")
    public ResponseEntity<?> trackOrder(@PathVariable String trackingCode) {
        return orderRepository.findByTrackingCode(trackingCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}