package com.mageireio.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "dishes")
public class Dish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category;
    private boolean active = true;

    private String name;
    private String description;
    private double price;
    private String imageUrl;

    @Column(length = 500)
    private String extras;

    private int availablePortions = 50;
    private int discount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    @JsonIgnore
    private Store store;

    @Column(name = "is_quick_item", nullable = false, columnDefinition = "boolean default false")
    private Boolean isQuickItem = false;

    @Column(name = "is_combo", nullable = false, columnDefinition = "boolean default false")
    private Boolean isCombo = false;

    @Column(nullable = true)
    private Double originalPrice;

    @OneToMany(mappedBy = "combo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("combo-items")
    private java.util.List<ComboItem> comboItems = new java.util.ArrayList<>();

    // --- ΝΕΑ ΠΕΔΙΑ ΓΙΑ ΤΗΝ ΑΥΤΟΜΑΤΗ ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ ---
    @Column(name = "auto_deactivate_end_day", nullable = false, columnDefinition = "boolean default false")
    private Boolean autoDeactivateEndDay = false;

    @Column(name = "deactivation_policy", nullable = false, columnDefinition = "varchar(50) default 'FOREVER'")
    private String deactivationPolicy = "FOREVER";

    @Column(name = "discount_price")
    private Double discountPrice;

    @com.fasterxml.jackson.annotation.JsonProperty("storeId")
    public void setStoreIdFromFrontend(Long storeId) {
        if (storeId != null) {
            com.mageireio.backend.model.Store s = new com.mageireio.backend.model.Store();
            s.setId(storeId);
            this.store = s;
        }
    }

    public Dish() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getExtras() {
        return extras;
    }

    public void setExtras(String extras) {
        this.extras = extras;
    }

    public Integer getAvailablePortions() {
        return availablePortions;
    }

    public void setAvailablePortions(Integer availablePortions) {
        this.availablePortions = availablePortions;
    }

    public int getDiscount() {
        return discount;
    }

    public void setDiscount(int discount) {
        this.discount = discount;
    }

    @JsonIgnore
    public Store getStore() {
        return store;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public Boolean getIsQuickItem() {
        return isQuickItem;
    }

    public void setIsQuickItem(Boolean isQuickItem) {
        this.isQuickItem = isQuickItem;
    }

    public Boolean getIsCombo() {
        return isCombo;
    }

    public void setIsCombo(Boolean isCombo) {
        this.isCombo = isCombo;
    }

    public Double getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(Double originalPrice) {
        this.originalPrice = originalPrice;
    }

    public java.util.List<ComboItem> getComboItems() { return comboItems; }
    public void setComboItems(java.util.List<ComboItem> comboItems) {
        this.comboItems.clear();
        if (comboItems != null) {
            this.comboItems.addAll(comboItems);
            for (ComboItem item : this.comboItems) {
                item.setCombo(this);
            }
        }
    }



    // --- GETTERS & SETTERS ΓΙΑ ΤΗΝ ΑΥΤΟΜΑΤΗ ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ ---
    public Boolean getAutoDeactivateEndDay() { return autoDeactivateEndDay; }
    public void setAutoDeactivateEndDay(Boolean autoDeactivateEndDay) { this.autoDeactivateEndDay = autoDeactivateEndDay; }

    public String getDeactivationPolicy() { return deactivationPolicy; }
    public void setDeactivationPolicy(String deactivationPolicy) { this.deactivationPolicy = deactivationPolicy; }
}