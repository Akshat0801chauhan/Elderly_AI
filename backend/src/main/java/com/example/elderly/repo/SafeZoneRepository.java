package com.example.elderly.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.elderly.model.SafeZone;
import com.example.elderly.model.User;

public interface SafeZoneRepository extends JpaRepository<SafeZone, String> {
    Optional<SafeZone> findByElder(User elder);
}
