package com.example.elderly.controller;

import org.springframework.http.ResponseEntity;
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
import com.example.elderly.service.MedicineService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/medicine")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    private String getEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new RuntimeException("User not authenticated");
        return auth.getName();
    }

    // Add medicine
    @PostMapping
    public ResponseEntity<?> addMedicine(@Valid @RequestBody AddMedicineRequest request) {
        return ResponseEntity.status(201).body(medicineService.addMedicine(getEmail(), request));
    }

    // Today's medicines with taken status (for dashboard + medicine page)
    @GetMapping
    public ResponseEntity<?> getTodayMedicines() {
        return ResponseEntity.ok(medicineService.getTodayMedicines(getEmail()));
    }

    // All medicines — for management/calendar page
    @GetMapping("/all")
    public ResponseEntity<?> getAllMedicines() {
        return ResponseEntity.ok(medicineService.getAllMedicines(getEmail()));
    }

    // Mark taken (per day)
    @PutMapping("/take/{id}")
    public ResponseEntity<?> markAsTaken(@PathVariable String id) {
        return ResponseEntity.ok(medicineService.markAsTaken(id, getEmail()));
    }

    // Progress for today
    @GetMapping("/progress")
    public ResponseEntity<?> getProgress() {
        return ResponseEntity.ok(medicineService.getProgress(getEmail()));
    }

    // Update medicine
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMedicine(
            @PathVariable String id,
            @Valid @RequestBody AddMedicineRequest request) {
        return ResponseEntity.ok(medicineService.updateMedicine(id, request, getEmail()));
    }

    // Delete medicine
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMedicine(@PathVariable String id) {
        medicineService.deleteMedicine(id, getEmail());
        return ResponseEntity.noContent().build();
    }
}
