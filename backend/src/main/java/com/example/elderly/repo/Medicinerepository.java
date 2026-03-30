package com.example.elderly.repo;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.elderly.model.Medicine;
import com.example.elderly.model.User;

public interface Medicinerepository extends JpaRepository<Medicine, String> {

    // existing
    List<Medicine> findByUserAndDateOrderByTimeAsc(User user, LocalDate date);

    // all medicines for a user (management page)
    List<Medicine> findByUser(User user);

    // active medicines on a specific date (PostgreSQL native query)
    @Query(
        value = """
            SELECT * FROM medicine
            WHERE user_id = :userId
              AND start_date <= :date
              AND :date <= (start_date + (number_of_days - 1) * INTERVAL '1 day')
            ORDER BY time ASC
        """,
        nativeQuery = true
    )
    List<Medicine> findActiveOnDate(@Param("userId") String userId, @Param("date") LocalDate date);
}