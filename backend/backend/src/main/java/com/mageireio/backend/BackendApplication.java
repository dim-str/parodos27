package com.mageireio.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}

@Bean
public CommandLineRunner initUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
	return args -> {
		// Ελέγχουμε αν η βάση δεν έχει χρήστες
		if (userRepository.count() == 0) {
			User admin = new User();
			admin.setUsername("admin");
			// ΠΡΟΣΟΧΗ: Πρέπει να κρυπτογραφήσεις τον κωδικό!
			admin.setPassword(passwordEncoder.encode("123456"));
			// Βάλε και τα υπόλοιπα πεδία που ίσως χρειάζεται ο χρήστης σου (π.χ. ρόλος)

			userRepository.save(admin);
			System.out.println("Δημιουργήθηκε ο χρήστης admin με κωδικό 123456");
		}
	};
}