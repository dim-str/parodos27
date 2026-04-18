package com.mageireio.backend.service;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.Dish;
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
        // 1. Χρήση του LOCK για προστασία αποθέματος
        Dish dish = dishRepository.findByIdWithLock(order.getDish().getId())
                .orElseThrow(() -> new RuntimeException("Το πιάτο δεν βρέθηκε!"));

        // 2. Έλεγχος αποθέματος
        if (dish.getAvailablePortions() != -1) {
            if (dish.getAvailablePortions() < order.getQuantity()) {
                throw new RuntimeException("Δεν επαρκούν οι μερίδες! Διαθέσιμες: " + dish.getAvailablePortions());
            }

            // 3. Μείωση και αποθήκευση πιάτου
            dish.setAvailablePortions(dish.getAvailablePortions() - order.getQuantity());
            dishRepository.save(dish);
        }

        // 4. Προετοιμασία παραγγελίας
        order.setDish(dish);
        order.setStatus(OrderStatus.PENDING); // Σιγουρευόμαστε για το status

        // 5. Αποθήκευση
        CustomerOrder savedOrder = orderRepository.save(order);

        // 6. WebSocket ειδοποίηση (Live στο Admin)
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

        // ΠΡΟΣΘΗΚΗ: Ενημέρωση και του tracking του πελάτη ότι ολοκληρώθηκε!
        messagingTemplate.convertAndSend("/topic/orderUpdates", order);
    }
}