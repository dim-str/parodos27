package com.mageireio.backend.dto;

import java.util.List;

public class OrderRequestDTO {
    private String customerName;
    private String phone;
    private String address;
    private String orderType;
    private String paymentMethod;
    private String notes;
    private List<ItemDTO> cartItems;

    // Getters & Setters
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public List<ItemDTO> getCartItems() { return cartItems; }
    public void setCartItems(List<ItemDTO> cartItems) { this.cartItems = cartItems; }

    // Εσωτερική κλάση για το κάθε πιάτο του καλαθιού
    public static class ItemDTO {
        private Long dishId;
        private int quantity;
        private String extras;

        public Long getDishId() { return dishId; }
        public void setDishId(Long dishId) { this.dishId = dishId; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
        public String getExtras() { return extras; }
        public void setExtras(String extras) { this.extras = extras; }
    }
}