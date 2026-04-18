package com.mageireio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "dishes")
public class Dish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category; // π.χ. "Πιάτα Ημέρας", "Ορεκτικά"
    private boolean active = true; // Toggle switch κατάσταση

    private String name;
    private String description;
    private double price;
    private String imageUrl;
    @Column(length = 500)
    private String extras;
    private int availablePortions = 50;
    private int discount = 0; // Προεπιλογή 0% έκπτωση// Το 50 είναι προεπιλογή για τα παλιά πιάτα

    // Κενός κατασκευαστής (απαραίτητος για τη βάση δεδομένων)
    public Dish() {
    }

    // --- Getters και Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean getActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getAvailablePortions() {
        return availablePortions;
    }

    public void setAvailablePortions(Integer availablePortions){
        this.availablePortions = availablePortions;
    }

    public String getExtras() {
        return extras;
    }

    public void setExtras(String extras) {
        this.extras = extras;
    }

    public int getDiscount() { return discount; }
    public void setDiscount(int discount) { this.discount = discount; }
}