package com.mageireio.backend.service;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.Dish;
import com.mageireio.backend.model.OrderItem;
import com.mageireio.backend.model.OrderStatus;
import com.mageireio.backend.repository.DishRepository;
import com.mageireio.backend.repository.OrderRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final DishRepository dishRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public OrderService(OrderRepository orderRepository, DishRepository dishRepository, SimpMessagingTemplate messagingTemplate) {
        this.orderRepository = orderRepository;
        this.dishRepository = dishRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public CustomerOrder placeOrder(CustomerOrder order) {
        
        // Ελέγχουμε και μειώνουμε το απόθεμα για ΚΑΘΕ πιάτο της παραγγελίας
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Dish dish = dishRepository.findByIdWithLock(item.getDish().getId())
                        .orElseThrow(() -> new RuntimeException("Το πιάτο δεν βρέθηκε!"));

                if (dish.getAvailablePortions() != -1) {
                    if (dish.getAvailablePortions() < item.getQuantity()) {
                        throw new RuntimeException("Δεν επαρκούν οι μερίδες για το: " + dish.getName() + "! Διαθέσιμες: " + dish.getAvailablePortions());
                    }

                    dish.setAvailablePortions(dish.getAvailablePortions() - item.getQuantity());
                    dishRepository.save(dish);
                }
                item.setDish(dish); // Βάζουμε το ενημερωμένο πιάτο στο item
                item.setOrder(order); // Συνδέουμε το item με την παραγγελία
            }
        }

        order.setStatus(OrderStatus.PENDING);
        CustomerOrder savedOrder = orderRepository.save(order);

        messagingTemplate.convertAndSend("/topic/newOrder", savedOrder);

        return savedOrder;
    }

    public List<CustomerOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional
    public void completeOrder(Long id) {
        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        messagingTemplate.convertAndSend("/topic/orderUpdates", order);
    }
}