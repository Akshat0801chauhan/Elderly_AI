package com.example.elderly.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.elderly.model.LocationAlert;
import com.example.elderly.model.User;

public interface LocationAlertRepository extends JpaRepository<LocationAlert, String> {
    List<LocationAlert> findTop10ByElderOrderByCreatedAtDesc(User elder);
}
