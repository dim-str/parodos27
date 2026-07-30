package com.mageireio.backend.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class DaySchedule {
    private boolean open = true;
    private String start = "12:00";
    private String end = "23:00";

    // Getters & Setters
    public boolean isOpen() { return open; }
    public void setOpen(boolean open) { this.open = open; }
    public String getStart() { return start; }
    public void setStart(String start) { this.start = start; }
    public String getEnd() { return end; }
    public void setEnd(String end) { this.end = end; }
}