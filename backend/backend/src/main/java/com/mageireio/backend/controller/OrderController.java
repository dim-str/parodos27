package com.mageireio.backend.controller;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.repository.OrderRepository;
import com.mageireio.backend.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final SimpMessagingTemplate messagingTemplate;
    private final OrderService orderService;
    private final OrderRepository orderRepository;

    public OrderController(SimpMessagingTemplate messagingTemplate, OrderService orderService, OrderRepository orderRepository) {
        this.messagingTemplate = messagingTemplate;
        this.orderService = orderService;
        this.orderRepository = orderRepository;
    }

    @PostMapping
    public CustomerOrder createOrder(@RequestBody CustomerOrder order) {
        return orderService.placeOrder(order);
    }

    @GetMapping
    public List<CustomerOrder> getOrders() {
        return orderService.getAllOrders();
    }

    @PutMapping("/{id}/complete")
    public void completeOrder(@PathVariable Long id) {
        orderService.completeOrder(id);
        orderRepository.findById(id).ifPresent(order -> messagingTemplate.convertAndSend("/topic/orderUpdates", order));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerOrder> updateOrder(@PathVariable Long id, @RequestBody CustomerOrder updatedOrder) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(updatedOrder.getStatus());
            order.setNotes(updatedOrder.getNotes());
            order.setEstimatedReadyTime(updatedOrder.getEstimatedReadyTime());
            CustomerOrder savedOrder = orderRepository.save(order);
            messagingTemplate.convertAndSend("/topic/orderUpdates", savedOrder);
            return ResponseEntity.ok(savedOrder);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        if (orderRepository.existsById(id)) {
            orderRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerOrder> getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
