package com.mageireio.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}

@Bean
public CommandLineRunner initUsers(
		UserRepository userRepository,
		PasswordEncoder passwordEncoder,
		@Value("${app.security.admin.username}") String adminUsername,
		@Value("${app.security.admin.password}") String adminPassword) {

	return args -> {
		// Ελέγχουμε αν η βάση είναι εντελώς άδεια από χρήστες
		if (userRepository.count() == 0) {
			User admin = new User();

			// Παίρνουμε το username από το application.properties
			admin.setUsername(adminUsername);

			// Παίρνουμε τον κωδικό, τον κρυπτογραφούμε και τον αποθηκεύουμε
			admin.setPassword(passwordEncoder.encode(adminPassword));

			// Αν έχεις πεδίο για ρόλο, βάλτο εδώ (π.χ. admin.setRole("ROLE_ADMIN");)

			userRepository.save(admin);
			System.out.println("✅ Δημιουργήθηκε αυτόματα ο χρήστης: " + adminUsername);
		}
	};
}