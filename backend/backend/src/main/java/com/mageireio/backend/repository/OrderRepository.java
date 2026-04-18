package com.mageireio.backend.repository;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByStatus(OrderStatus status);
}