package com.mageireio.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.mageireio.backend.model.OrderItem;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    private String orderType;
    private String address;
    private String phone;
    private String customerName;
    private String estimatedReadyTime;

    @Column(length = 500)
    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    @JsonIgnore
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true) 
    @com.fasterxml.jackson.annotation.JsonIgnore
    private AppUser user;

    @Column(unique = true)
    private String trackingCode;

    // --- WOLT DRIVE FIELDS ---
    @Column(name = "wolt_delivery_id")
    private String woltDeliveryId;

    @Column(name = "wolt_tracking_url")
    private String woltTrackingUrl;

    @Column(name = "wolt_delivery_status")
    private String woltDeliveryStatus;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @PrePersist
    public void prePersist() {
        if (this.trackingCode == null) {
            this.trackingCode = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        
        if (this.items != null) {
            for (OrderItem item : this.items) {
                item.setOrder(this);
            }
        }
    }

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private java.util.List<OrderItem> items = new java.util.ArrayList<>();


    @Column(name = "wolt_delivery_cost")
    private Double woltDeliveryCost = 0.0;

    public CustomerOrder() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }

    public String getEstimatedReadyTime() {
        return estimatedReadyTime;
    }

    public void setEstimatedReadyTime(String estimatedReadyTime) {
        this.estimatedReadyTime = estimatedReadyTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }


    @JsonIgnore
    public Store getStore() {
        return store;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public String getTrackingCode() { return trackingCode; }
    public void setTrackingCode(String trackingCode) { this.trackingCode = trackingCode; }

    public java.util.List<OrderItem> getItems() { return items; }
    public void setItems(java.util.List<OrderItem> items) { 
        this.items = items; 
        for(OrderItem item : items) {
            item.setOrder(this); // Συνδέει αυτόματα το item με αυτή την παραγγελία
        }
    }

    // --- ΠΡΟΣΘΗΚΗ ΣΤΑ GETTERS & SETTERS (στο τέλος του αρχείου) ---
    public String getWoltDeliveryId() { return woltDeliveryId; }
    public void setWoltDeliveryId(String woltDeliveryId) { this.woltDeliveryId = woltDeliveryId; }

    public String getWoltTrackingUrl() { return woltTrackingUrl; }
    public void setWoltTrackingUrl(String woltTrackingUrl) { this.woltTrackingUrl = woltTrackingUrl; }

    public String getWoltDeliveryStatus() { return woltDeliveryStatus; }
    public void setWoltDeliveryStatus(String woltDeliveryStatus) { this.woltDeliveryStatus = woltDeliveryStatus; }

    public Double getWoltDeliveryCost() { return woltDeliveryCost; }
    public void setWoltDeliveryCost(Double woltDeliveryCost) { this.woltDeliveryCost = woltDeliveryCost; }

    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public void setStripePaymentIntentId(String stripePaymentIntentId) { this.stripePaymentIntentId = stripePaymentIntentId; }
}
