package com.mageireio.backend.service;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.OrderItem;
import com.mageireio.backend.model.OrderStatus;
import com.mageireio.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private OrderRepository orderRepository;

    public Map<String, Integer> getAverageSalesPerDay(String dishName) {
        List<CustomerOrder> history = orderRepository.findByStatus(OrderStatus.COMPLETED);

        // Ξεδιπλώνουμε όλες τις παραγγελίες στα επιμέρους items τους (flatMap)
        return history.stream()
                .flatMap(order -> order.getItems().stream()) 
                .filter(item -> item.getDish() != null && item.getDish().getName().equals(dishName))
                .collect(Collectors.groupingBy(
                        item -> item.getOrder().getCreatedAt().getDayOfWeek().toString(), // Ημέρα από την παραγγελία
                        Collectors.summingInt(OrderItem::getQuantity) // Άθροισμα ποσοτήτων από το item
                ));
    }
}