package com.example.elderly.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.elderly.dto.AddMedicineRequest;
import com.example.elderly.service.MedicineService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/medicine")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    private String getEmail() {
        return SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }

    @PostMapping
    public ResponseEntity<?> addMedicine(@RequestBody AddMedicineRequest request) {
        return ResponseEntity.ok(medicineService.addMedicine(getEmail(), request));
    }

    @GetMapping
    public ResponseEntity<?> getTodayMedicines() {
        return ResponseEntity.ok(medicineService.getTodayMedicines(getEmail()));
    }

    @PutMapping("/take/{id}")
    public ResponseEntity<?> markAsTaken(@PathVariable String id) {
        return ResponseEntity.ok(medicineService.markAsTaken(id));
    }

    @GetMapping("/progress")
    public ResponseEntity<?> getProgress() {
        return ResponseEntity.ok(medicineService.getProgress(getEmail()));
    }
}
