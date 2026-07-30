package com.mageireio.backend.repository;

import com.mageireio.backend.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByFirebaseUid(String firebaseUid);
    Optional<AppUser> findByEmail(String email);
}