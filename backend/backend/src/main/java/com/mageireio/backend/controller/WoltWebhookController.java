package com.mageireio.backend.controller;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.OrderStatus; // <-- Προστέθηκε το import του Enum!
import com.mageireio.backend.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/webhooks/wolt")
public class WoltWebhookController {

    private final OrderRepository orderRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public WoltWebhookController(OrderRepository orderRepository, SimpMessagingTemplate messagingTemplate) {
        this.orderRepository = orderRepository;
        this.messagingTemplate = messagingTemplate; 
    }

    @PostMapping("/status")
    public ResponseEntity<?> handleWoltStatusUpdate(@RequestBody Map<String, Object> payload) {
        try {
            String woltOrderId = (String) payload.get("wolt_order_reference_id");
            String newStatus = (String) payload.get("status");

            if (woltOrderId != null && newStatus != null) {
                Optional<CustomerOrder> orderOpt = orderRepository.findByWoltDeliveryId(woltOrderId);
                
                if (orderOpt.isPresent()) {
                    CustomerOrder order = orderOpt.get();
                    order.setWoltDeliveryStatus(newStatus);
                    
                    // Αν παραδόθηκε, ολοκληρώνουμε και την παραγγελία στο δικό μας σύστημα
                    if ("delivered".equalsIgnoreCase(newStatus)) {
                        order.setStatus(OrderStatus.COMPLETED); // <-- Διορθώθηκε: Χρήση του Enum αντί για String
                    }
                    
                    orderRepository.save(order);
                    
                    // Στέλνουμε το update στα WebSockets για να το δει ο Admin Live
                    messagingTemplate.convertAndSend("/topic/orders/" + order.getStore().getId(), order);
                }
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Wolt Webhook Error: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}