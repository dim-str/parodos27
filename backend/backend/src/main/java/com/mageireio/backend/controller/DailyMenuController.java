package com.mageireio.backend.controller;

import com.mageireio.backend.model.DailyMenu;
import com.mageireio.backend.repository.DailyMenuRepository;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/daily-menu")
public class DailyMenuController {

    private final DailyMenuRepository dailyMenuRepository;

    public DailyMenuController(DailyMenuRepository dailyMenuRepository) {
        this.dailyMenuRepository = dailyMenuRepository;
    }

    @GetMapping
    public List<DailyMenu> getDailyMenu() {
        return dailyMenuRepository.findAll();
    }

    @PostMapping
    public DailyMenu createDailyMenu(@RequestBody DailyMenu dailyMenu) {
        List<DailyMenu> existingMenus = dailyMenuRepository.findByDishIdAndDate(
                dailyMenu.getDish().getId(),
                dailyMenu.getDate()
        );

        if (!existingMenus.isEmpty()) {
            DailyMenu menuToUpdate = existingMenus.get(0);
            int newTotalPortions = menuToUpdate.getAvailablePortions() + dailyMenu.getAvailablePortions();
            menuToUpdate.setAvailablePortions(newTotalPortions);
            return dailyMenuRepository.save(menuToUpdate);
        }

        return dailyMenuRepository.save(dailyMenu);
    }

    @DeleteMapping("/clear")
    public void clearDailyMenu() {
        dailyMenuRepository.deleteAll();
    }

    @DeleteMapping("/dish/{dishId}")
    @Transactional
    public void removeDishFromDailyMenu(@PathVariable Long dishId) {
        List<DailyMenu> menus = dailyMenuRepository.findByDishIdAndDate(dishId, LocalDate.now());
        for (DailyMenu menu : menus) {
            menu.setAvailablePortions(0);
            dailyMenuRepository.save(menu);
        }
    }
}
