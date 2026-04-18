package com.mageireio.backend.controller;

import com.mageireio.backend.config.CloudinaryConfig;
import com.mageireio.backend.model.Dish;
import com.mageireio.backend.repository.DishRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/dishes")
public class DishController {

    private final DishRepository dishRepository;
    private final CloudinaryConfig.ImageService imageService;

    public DishController(DishRepository dishRepository, CloudinaryConfig.ImageService imageService) {
        this.dishRepository = dishRepository;
        this.imageService = imageService;
    }

    @GetMapping
    public List<Dish> getAllDishes() {
        return dishRepository.findAll();
    }

    @GetMapping("/active")
    public List<Dish> getActiveDishes() {
        return dishRepository.findByActiveTrue();
    }

    @PostMapping
    public Dish addDish(@RequestBody Dish dish) {
        return dishRepository.save(dish);
    }

    @PatchMapping("/{id}/toggle")
    public Dish toggleActive(@PathVariable Long id, @RequestParam boolean status) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dish not found"));
        dish.setActive(status);
        return dishRepository.save(dish);
    }

    @PutMapping("/{id}")
    public Dish updateDish(@PathVariable Long id, @RequestBody Dish updatedDish) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dish not found"));

        dish.setName(updatedDish.getName());
        dish.setPrice(updatedDish.getPrice());
        dish.setCategory(updatedDish.getCategory());
        dish.setExtras(updatedDish.getExtras());
        dish.setDescription(updatedDish.getDescription());
        dish.setImageUrl(updatedDish.getImageUrl());
        dish.setAvailablePortions(updatedDish.getAvailablePortions());
        dish.setActive(updatedDish.getActive());

        return dishRepository.save(dish);
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<String> uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = imageService.uploadImage(file);
            Dish dish = dishRepository.findById(id).orElseThrow();
            dish.setImageUrl(imageUrl);
            dishRepository.save(dish);
            return ResponseEntity.ok(imageUrl);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed");
        }
    }
}
