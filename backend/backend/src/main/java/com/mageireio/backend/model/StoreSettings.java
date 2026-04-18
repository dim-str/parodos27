package com.mageireio.backend.model;

import jakarta.persistence.*;

import java.util.List;
import java.util.ArrayList;

@Entity
public class StoreSettings {

    @Id
    private Long id = 1L; // Θα έχουμε μόνο μία εγγραφή με ID 1
    private boolean open = true;

    // Αναλυτικό ωράριο
    private String monday = "08:00 - 23:00";
    private String tuesday = "08:00 - 23:00";
    private String wednesday = "08:00 - 23:00";
    private String thursday = "08:00 - 23:00";
    private String friday = "08:00 - 23:00";
    private String saturday = "09:00 - 22:00";
    private String sunday = "Κλειστά";

    // Αυτή είναι η "Μαύρη Λίστα" της ημέρας!
    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> disabledExtras;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> globalExtras = new ArrayList<>();

    // --- GETTERS & SETTERS ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isOpen() { return open; }
    public void setOpen(boolean open) { this.open = open; }

    public String getMonday() { return monday; }
    public void setMonday(String monday) { this.monday = monday; }

    public String getTuesday() { return tuesday; }
    public void setTuesday(String tuesday) { this.tuesday = tuesday; }

    public String getWednesday() { return wednesday; }
    public void setWednesday(String wednesday) { this.wednesday = wednesday; }

    public String getThursday() { return thursday; }
    public void setThursday(String thursday) { this.thursday = thursday; }

    public String getFriday() { return friday; }
    public void setFriday(String friday) { this.friday = friday; }

    public String getSaturday() { return saturday; }
    public void setSaturday(String saturday) { this.saturday = saturday; }

    public String getSunday() { return sunday; }
    public void setSunday(String sunday) { this.sunday = sunday; }

    public List<String> getDisabledExtras() {
        return disabledExtras;
    }

    public void setDisabledExtras(List<String> disabledExtras) {
        this.disabledExtras = disabledExtras;
    }

    public List<String> getGlobalExtras() { return globalExtras; }
    public void setGlobalExtras(List<String> globalExtras) { this.globalExtras = globalExtras; }

}
