package com.mageireio.backend.controller;

import com.mageireio.backend.model.StoreSettings;
import com.mageireio.backend.repository.SettingsRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final SettingsRepository repository;

    public SettingsController(SettingsRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public StoreSettings getSettings() {
        return repository.findById(1L).orElse(new StoreSettings());
    }

    @PutMapping
    public StoreSettings updateSettings(@RequestBody StoreSettings settings) {
        settings.setId(1L);
        return repository.save(settings);
    }
}
