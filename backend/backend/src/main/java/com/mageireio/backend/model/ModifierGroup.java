package com.mageireio.backend.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "modifier_groups")
public class ModifierGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // π.χ. "Επιλογή Σως"
    
    private Boolean isRequired = false; 

    // ΝΕΟ: Πόσες επιλογές δικαιούται δωρεάν (π.χ. 1 για "Πρώτη δωρεάν, μετά χρέωση")
    private Integer freeSelections = 0; 

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> linkedCategories = new ArrayList<>(); 

    @ElementCollection(fetch = FetchType.EAGER)
    private List<Long> linkedDishes = new ArrayList<>(); 

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> items = new ArrayList<>(); // "Name|Price|isDefault"

    @Column(name = "selection_type")
    private String selectionType = "multiple";

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }

    public Integer getFreeSelections() { return freeSelections; }
    public void setFreeSelections(Integer freeSelections) { this.freeSelections = freeSelections; }
    
    public List<String> getLinkedCategories() { return linkedCategories; }
    public void setLinkedCategories(List<String> linkedCategories) { this.linkedCategories = linkedCategories; }
    
    public List<Long> getLinkedDishes() { return linkedDishes; }
    public void setLinkedDishes(List<Long> linkedDishes) { this.linkedDishes = linkedDishes; }
    
    public List<String> getItems() { return items; }
    public void setItems(List<String> items) { this.items = items; }

    public String getSelectionType() { return selectionType; }
    public void setSelectionType(String selectionType) { this.selectionType = selectionType; }
}