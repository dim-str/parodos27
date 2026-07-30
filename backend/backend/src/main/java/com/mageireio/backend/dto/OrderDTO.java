package com.mageireio.backend.dto;

import lombok.Data;

@Data // Το Lombok φτιάχνει αυτόματα Getters/Setters
public class OrderDTO {
    private String customerName;
    private String phone;
    private String address;
    private String floor;
    private String bell;
    private String orderType;
    private String status;
}