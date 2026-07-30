package com.mageireio.backend.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "store_settings")
public class StoreSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;
    
    private boolean open = true;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "open", column = @Column(name = "monday_open")),
        @AttributeOverride(name = "start", column = @Column(name = "monday_start")),
        @AttributeOverride(name = "end", column = @Column(name = "monday_end"))
    })
    private DaySchedule monday = new DaySchedule();

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "open", column = @Column(name = "tuesday_open")),
        @AttributeOverride(name = "start", column = @Column(name = "tuesday_start")),
        @AttributeOverride(name = "end", column = @Column(name = "tuesday_end"))
    })
    private DaySchedule tuesday = new DaySchedule();

    @Embedded
    @AttributeOverrides({   
        @AttributeOverride(name = "open", column = @Column(name = "wednesday_open")),
        @AttributeOverride(name = "start", column = @Column(name = "wednesday_start")),
        @AttributeOverride(name = "end", column = @Column(name = "wednesday_end"))
    })
    private DaySchedule wednesday = new DaySchedule();

    @Embedded
    @AttributeOverrides({   
        @AttributeOverride(name = "open", column = @Column(name = "thursday_open")),
        @AttributeOverride(name = "start", column = @Column(name = "thursday_start")),
        @AttributeOverride(name = "end", column = @Column(name = "thursday_end"))
    })
    private DaySchedule thursday = new DaySchedule();

    @Embedded
    @AttributeOverrides({   
        @AttributeOverride(name = "open", column = @Column(name = "friday_open")),
        @AttributeOverride(name = "start", column = @Column(name = "friday_start")),
        @AttributeOverride(name = "end", column = @Column(name = "friday_end"))
    })
    private DaySchedule friday = new DaySchedule();

    @Embedded
    @AttributeOverrides({   
        @AttributeOverride(name = "open", column = @Column(name = "saturday_open")),
        @AttributeOverride(name = "start", column = @Column(name = "saturday_start")),
        @AttributeOverride(name = "end", column = @Column(name = "saturday_end"))
    })
    private DaySchedule saturday = new DaySchedule();

    @Embedded
    @AttributeOverrides({   
        @AttributeOverride(name = "open", column = @Column(name = "sunday_open")),
        @AttributeOverride(name = "start", column = @Column(name = "sunday_start")),
        @AttributeOverride(name = "end", column = @Column(name = "sunday_end"))
    })
    private DaySchedule sunday = new DaySchedule();

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> categoryOrder = new ArrayList<>();

    // --- ΝΕΟ: Σύνδεση με τις έξυπνες Ομάδες Συνοδευτικών ---
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "store_settings_id")
    private List<ModifierGroup> modifierGroups = new ArrayList<>();

    @Column(name = "stripe_public_key")
    private String stripePublicKey;
    
    @Column(name = "stripe_secret_key")
    private String stripeSecretKey;

    @OneToOne
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(name = "wolt_merchant_id")
    private String woltMerchantId;
    
    @Column(name = "wolt_api_key")
    private String woltApiKey;

    @Column(name = "customer_delivery_fee_percentage")
    private Integer customerDeliveryFeePercentage = 100;

    @Column(name = "global_discount_percentage")
    private Double globalDiscountPercentage; 

    @Column(name = "category_discount_name")
    private String categoryDiscountName; 

    @Column(name = "category_discount_percentage")
    private Double categoryDiscountPercentage;

    @Column(name = "primary_color")
    private String primaryColor = "#F97316";

    // --- GETTERS & SETTERS ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isOpen() { return open; }
    public void setOpen(boolean open) { this.open = open; }

    public DaySchedule getMonday() { return monday; }
    public void setMonday(DaySchedule monday) { this.monday = monday; }

    public DaySchedule getTuesday() { return tuesday; }
    public void setTuesday(DaySchedule tuesday) { this.tuesday = tuesday; }

    public DaySchedule getWednesday() { return wednesday; }
    public void setWednesday(DaySchedule wednesday) { this.wednesday = wednesday; }

    public DaySchedule getThursday() { return thursday; }
    public void setThursday(DaySchedule thursday) { this.thursday = thursday; }

    public DaySchedule getFriday() { return friday; }
    public void setFriday(DaySchedule friday) { this.friday = friday; } 

    public DaySchedule getSaturday() { return saturday; }
    public void setSaturday(DaySchedule saturday) { this.saturday = saturday; }

    public DaySchedule getSunday() { return sunday; }
    public void setSunday(DaySchedule sunday) { this.sunday = sunday; }

    public List<String> getCategoryOrder() { return categoryOrder; }
    public void setCategoryOrder(List<String> categoryOrder) { this.categoryOrder = categoryOrder; }

    public List<ModifierGroup> getModifierGroups() { return modifierGroups; }
    public void setModifierGroups(List<ModifierGroup> modifierGroups) { this.modifierGroups = modifierGroups; }

    public Store getStore() { return store; }
    public void setStore(Store store) { this.store = store; }

    public String getStripePublicKey() { return stripePublicKey; }
    public void setStripePublicKey(String stripePublicKey) { this.stripePublicKey = stripePublicKey; }

    public String getStripeSecretKey() { return stripeSecretKey; }
    public void setStripeSecretKey(String stripeSecretKey) { this.stripeSecretKey = stripeSecretKey; }

    public String getWoltMerchantId() { return woltMerchantId; }
    public void setWoltMerchantId(String woltMerchantId) { this.woltMerchantId = woltMerchantId; }

    public String getWoltApiKey() { return woltApiKey; }
    public void setWoltApiKey(String woltApiKey) { this.woltApiKey = woltApiKey; }

    public Integer getCustomerDeliveryFeePercentage() { return customerDeliveryFeePercentage; }
    public void setCustomerDeliveryFeePercentage(Integer customerDeliveryFeePercentage) { this.customerDeliveryFeePercentage = customerDeliveryFeePercentage; }

    public Double getGlobalDiscountPercentage() { return globalDiscountPercentage; }
    public void setGlobalDiscountPercentage(Double globalDiscountPercentage) { this.globalDiscountPercentage = globalDiscountPercentage; }

    public String getCategoryDiscountName() { return categoryDiscountName; }
    public void setCategoryDiscountName(String categoryDiscountName) { this.categoryDiscountName = categoryDiscountName; }

    public Double getCategoryDiscountPercentage() { return categoryDiscountPercentage; }
    public void setCategoryDiscountPercentage(Double categoryDiscountPercentage) { this.categoryDiscountPercentage = categoryDiscountPercentage; }

    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }
}