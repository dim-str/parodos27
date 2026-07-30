package com.mageireio.backend.repository;

import com.mageireio.backend.model.DailyMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyMenuRepository extends JpaRepository<DailyMenu, Long> {

    // Αυτή είναι η μέθοδος που ψάχνει ο Controller
    List<DailyMenu> findByDishIdAndDate(Long dishId, LocalDate date);

    // Αυτή είναι η μέθοδος για το "σβήσιμο" μέσω Toggle
    void deleteByDishIdAndDate(Long dishId, LocalDate date);
}