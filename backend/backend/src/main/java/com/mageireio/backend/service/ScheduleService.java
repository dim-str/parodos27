package com.mageireio.backend.service;

import com.mageireio.backend.model.DaySchedule;
import com.mageireio.backend.model.StoreSettings;
import org.springframework.stereotype.Service;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.Locale;

@Service
public class ScheduleService {

    public boolean isStoreOpen(StoreSettings settings) {
        // 1. Χειροκίνητο override
        if (!settings.isOpen()) return false;

        // 2. Αυτόματος έλεγχος ώρας
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String dayOfWeek = now.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH).toLowerCase();
        LocalTime nowTime = now.toLocalTime();

        DaySchedule schedule = getScheduleForDay(settings, dayOfWeek);
        
        if (schedule == null || !schedule.isOpen()) return false;

        LocalTime start = LocalTime.parse(schedule.getStart());
        LocalTime end = LocalTime.parse(schedule.getEnd());

        return nowTime.isAfter(start) && nowTime.isBefore(end);
    }

    private DaySchedule getScheduleForDay(StoreSettings s, String day) {
        switch (day) {
            case "monday": return s.getMonday();
            case "tuesday": return s.getTuesday();
            // ... κτλ ...
            default: return null;
        }
    }
}