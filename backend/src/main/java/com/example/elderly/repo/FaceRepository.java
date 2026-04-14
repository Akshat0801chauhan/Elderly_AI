package com.example.elderly.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.elderly.model.Face;
import com.example.elderly.model.User;

public interface FaceRepository extends JpaRepository<Face, String> {
    List<Face> findAllByUser(User user);
    Optional<Face> findBySlugAndUser(String slug, User user);
}
