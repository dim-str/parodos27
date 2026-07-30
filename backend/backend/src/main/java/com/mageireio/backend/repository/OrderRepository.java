package com.mageireio.backend.repository;

import com.mageireio.backend.model.CustomerOrder;
import com.mageireio.backend.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByStatus(OrderStatus status);

    List<CustomerOrder> findByStoreId(Long storeId);

    List<CustomerOrder> findByStoreIdAndStatus(Long storeId, OrderStatus status);

    Optional<CustomerOrder> findByIdAndStoreId(Long id, Long storeId);

    Optional<CustomerOrder> findByTrackingCode(String trackingCode);

    Optional<CustomerOrder> findByWoltDeliveryId(String woltDeliveryId);

    List<CustomerOrder> findByUser_FirebaseUidOrderByIdDesc(String firebaseUid);
}
