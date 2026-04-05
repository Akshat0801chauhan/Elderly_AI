package com.example.elderly.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.elderly.model.CaregiverAssignment;

public interface CaregiverAssignmentRepository extends JpaRepository<CaregiverAssignment, String> {

    List<CaregiverAssignment> findByCaregiverId(String caregiverId);

    Optional<CaregiverAssignment> findByCaregiverIdAndElderlyId(String caregiverId, String elderlyId);

    boolean existsByCaregiverIdAndElderlyId(String caregiverId, String elderlyId);
}
