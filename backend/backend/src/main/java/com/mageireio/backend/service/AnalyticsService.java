package com.mageireio.backend.service;

import com.mageireio.backend.model.CustomerOrder;
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

        // Φιλτράρουμε για το συγκεκριμένο πιάτο και ομαδοποιούμε ανά ημέρα
        return history.stream()
                .filter(o -> (o.getDish() != null && o.getDish().getName().equals(dishName)))
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().getDayOfWeek().toString(), // Χρειάζεσαι ένα πεδίο createdAt στην Order
                        Collectors.summingInt(CustomerOrder::getQuantity)
                ));
    }
}
