package com.example.elderly.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.elderly.model.User;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
}

