package com.mageireio.backend.repository;

import com.mageireio.backend.model.StoreSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettingsRepository extends JpaRepository<StoreSettings, Long> {
    // Κάνοντας extend το JpaRepository, η Java καταλαβαίνει αυτόματα
    // πώς να κάνει save, findById, delete κτλ χωρίς να γράψουμε γραμμή κώδικα!
}