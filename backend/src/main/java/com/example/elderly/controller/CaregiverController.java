package com.example.elderly.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.elderly.dto.AddMedicineRequest;
import com.example.elderly.dto.UpdateProfileRequest;
import com.example.elderly.model.User;
import com.example.elderly.service.CaregiverAccessService;
import com.example.elderly.service.MedicineService;
import com.example.elderly.service.ProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/caregiver")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CAREGIVER')")
public class CaregiverController {

    private final CaregiverAccessService caregiverAccessService;
    private final ProfileService profileService;
    private final MedicineService medicineService;

    private String getEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/elderly-users")
    public ResponseEntity<?> getLinkedElderlyUsers() {
        return ResponseEntity.ok(caregiverAccessService.getLinkedElderlyUsers(getEmail()));
    }

    @GetMapping("/elderly-users/{elderlyId}/profile")
    public ResponseEntity<?> getElderlyProfile(@PathVariable String elderlyId) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        return ResponseEntity.ok(profileService.getProfileForElderly(elderly));
    }

    @PutMapping("/elderly-users/{elderlyId}/profile")
    public ResponseEntity<?> updateElderlyProfile(
            @PathVariable String elderlyId,
            @Valid @RequestBody UpdateProfileRequest request) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        return ResponseEntity.ok(profileService.updateProfileForElderly(elderly, request));
    }

    @GetMapping("/elderly-users/{elderlyId}/medicines")
    public ResponseEntity<?> getAllMedicines(@PathVariable String elderlyId) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        return ResponseEntity.ok(medicineService.getAllMedicinesForElderly(elderly));
    }

    @PostMapping("/elderly-users/{elderlyId}/medicines")
    public ResponseEntity<?> addMedicine(
            @PathVariable String elderlyId,
            @Valid @RequestBody AddMedicineRequest request) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        return ResponseEntity.status(201).body(medicineService.addMedicineForElderly(elderly, request));
    }

    @PutMapping("/elderly-users/{elderlyId}/medicines/{medicineId}")
    public ResponseEntity<?> updateMedicine(
            @PathVariable String elderlyId,
            @PathVariable String medicineId,
            @Valid @RequestBody AddMedicineRequest request) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        return ResponseEntity.ok(medicineService.updateMedicineForElderly(medicineId, elderly, request));
    }

    @DeleteMapping("/elderly-users/{elderlyId}/medicines/{medicineId}")
    public ResponseEntity<?> deleteMedicine(
            @PathVariable String elderlyId,
            @PathVariable String medicineId) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        medicineService.deleteMedicineForElderly(medicineId, elderly);
        return ResponseEntity.noContent().build();
    }
}
