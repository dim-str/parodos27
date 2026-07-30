package com.mageireio.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Επιτρέπουμε την πρόσβαση στο φάκελο "uploads" μέσω του URL /uploads/
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Εφαρμόζεται σε όλα τα endpoints (/api/checkout, /api/users, κλπ)
                .allowedOriginPatterns("*") // Επιτρέπει αιτήματα από παντού (π.χ. localhost:3000)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Επιτρέπει όλες τις μεθόδους
                .allowedHeaders("*")
                .allowCredentials(false);
    }
}