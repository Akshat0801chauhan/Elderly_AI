package com.example.elderly.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.elderly.model.ElderLocationState;
import com.example.elderly.model.User;

public interface ElderLocationStateRepository extends JpaRepository<ElderLocationState, String> {
    Optional<ElderLocationState> findByElder(User elder);
}
