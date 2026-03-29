package com.example.elderly.repo;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.elderly.model.Medicine;
import com.example.elderly.model.User;

public interface Medicinerepository extends JpaRepository<Medicine, String> {

    List<Medicine> findByUserAndDateOrderByTimeAsc(User user, LocalDate date);
}
