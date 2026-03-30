package com.example.elderly.repo;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.example.elderly.model.Medicine;
import com.example.elderly.model.MedicineTakenLog;

public interface MedicineTakenLogRepository extends JpaRepository<MedicineTakenLog, String> {

    Optional<MedicineTakenLog> findByMedicineAndLogDate(Medicine medicine, LocalDate logDate);

    List<MedicineTakenLog> findByLogDate(LocalDate logDate);

    List<MedicineTakenLog> findAllByMedicine(Medicine medicine);

    // @Modifying + @Transactional required for delete queries in Spring Data JPA
    @Modifying
    @Transactional
    @Query("DELETE FROM MedicineTakenLog l WHERE l.logDate < :date")
    void deleteByLogDateBefore(@Param("date") LocalDate date);
}