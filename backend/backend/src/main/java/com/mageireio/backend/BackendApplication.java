package com.mageireio.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
// Βάλε εδώ και τα imports για User και UserRepository

@SpringBootApplication
public class BackendApplication {

	// 1. Η κύρια μέθοδος main
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	// 2. Ο κώδικας που προσθέσαμε πρέπει να είναι ΕΔΩ,
	// ΜΕΣΑ στην κλάση BackendApplication!
	@Bean
	public CommandLineRunner initUsers(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			@Value("${app.security.admin.username}") String adminUsername,
			@Value("${app.security.admin.password}") String adminPassword) {

		return args -> {
			if (userRepository.count() == 0) {
				User admin = new User();
				admin.setUsername(adminUsername);
				admin.setPassword(passwordEncoder.encode(adminPassword));
				userRepository.save(admin);
				System.out.println("✅ Δημιουργήθηκε αυτόματα ο χρήστης: " + adminUsername);
			}
		};
	}

}