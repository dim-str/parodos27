package com.mageireio.backend.repository;

import com.mageireio.backend.model.Dish;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DishRepository extends JpaRepository<Dish, Long> {

    List<Dish> findByStoreIdAndActiveTrue(Long storeId);

    List<Dish> findByStoreId(Long storeId);

    List<Dish> findByActiveTrue();

    Optional<Dish> findByIdAndStoreId(Long id, Long storeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Dish d WHERE d.id = :id")
    Optional<Dish> findByIdWithLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Dish d WHERE d.id = :id AND d.store.id = :storeId")
    Optional<Dish> findByIdAndStoreIdWithLock(@Param("id") Long id, @Param("storeId") Long storeId);
}
