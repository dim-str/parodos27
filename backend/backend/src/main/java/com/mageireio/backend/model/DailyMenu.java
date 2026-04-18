package com.mageireio.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "daily_menus")
public class DailyMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Εδώ γίνεται η μαγεία! Ενώνουμε το Ημερήσιο Μενού με το Πιάτο
    @ManyToOne
    @JoinColumn(name = "dish_id", nullable = false)
    private Dish dish;

    // Ημερομηνία που μαγειρεύτηκε
    private LocalDate date;

    // Πόσες μερίδες βγάλαμε σήμερα
    private int availablePortions;

    public DailyMenu() {
    }

    // --- Getters και Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Dish getDish() {
        return dish;
    }

    public void setDish(Dish dish) {
        this.dish = dish;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getAvailablePortions() {
        return availablePortions;
    }

    public void setAvailablePortions(int availablePortions) {
        this.availablePortions = availablePortions;
    }
}