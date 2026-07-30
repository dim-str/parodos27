package com.mageireio.backend.config;

import com.mageireio.backend.model.User;
import com.mageireio.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {

            // 1. Force Reset για τον Master
            User master = userRepository.findByUsername("master_dimitris").orElse(new User());
            master.setUsername("master_dimitris");
            // Βάζουμε τον κωδικό ξανά και τον κρυπτογραφούμε
            master.setPassword(passwordEncoder.encode("123456"));
            master.setRole("ROLE_SUPER_ADMIN");
            userRepository.save(master);
            System.out.println("✅ Master user password reset to: 123456");

            // 2. Force Reset για τον Admin
            User admin = userRepository.findByUsername("admin").orElse(new User());
            admin.setUsername("admin");
            // Βάζουμε τον κωδικό ξανά και τον κρυπτογραφούμε
            admin.setPassword(passwordEncoder.encode("parodos27"));
            admin.setRole("ROLE_STORE_ADMIN");
            userRepository.save(admin);
            System.out.println("✅ Admin user password reset to: parodos27");

        };
    }
}