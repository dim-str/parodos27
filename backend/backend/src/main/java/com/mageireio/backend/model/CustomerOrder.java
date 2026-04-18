package com.mageireio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING) // Αυτό λέει στη βάση δεδομένων να αποθηκεύει τη λέξη (π.χ. "PENDING")
    private OrderStatus status = OrderStatus.PENDING; // Προεπιλογή
    private String orderType;
    private String address;
    private String phone;

    private String customerName;
    private int quantity;

    @ManyToOne
    @JoinColumn(name = "dish_id")
    private Dish dish;

    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();

    public CustomerOrder() {}

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    @Column(length = 500) // Βάζουμε μεγάλο μήκος για να χωράει τα σχόλια
    private String notes;
    public Dish getDish() { return dish; }
    public void setDish(Dish dish) { this.dish = dish; }
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
}