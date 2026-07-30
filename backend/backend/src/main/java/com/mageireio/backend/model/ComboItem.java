package com.mageireio.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
public class ComboItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "combo_id")
    @JsonBackReference("combo-items")
    private Dish combo;

    @ManyToOne
    @JoinColumn(name = "dish_id")
    private Dish dish;

    private int quantity = 1;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Dish getCombo() { return combo; }
    public void setCombo(Dish combo) { this.combo = combo; }
    public Dish getDish() { return dish; }
    public void setDish(Dish dish) { this.dish = dish; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}