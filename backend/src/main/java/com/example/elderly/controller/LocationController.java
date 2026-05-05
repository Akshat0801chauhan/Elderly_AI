package com.example.elderly.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.elderly.dto.LocationUpdateRequest;
import com.example.elderly.dto.SafeZoneRequest;
import com.example.elderly.model.User;
import com.example.elderly.service.CaregiverAccessService;
import com.example.elderly.service.LocationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LocationController {
    private final LocationService locationService;
    private final CaregiverAccessService caregiverAccessService;

    private String getEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping("/location/update")
    @PreAuthorize("hasRole('ELDERLY')")
    public ResponseEntity<?> updateLocation(@Valid @RequestBody LocationUpdateRequest request) {
        return ResponseEntity.ok(locationService.updateElderLocation(getEmail(), request));
    }

    @GetMapping("/caregiver/elderly-users/{elderlyId}/safe-zone")
    @PreAuthorize("hasRole('CAREGIVER')")
    public ResponseEntity<?> getSafeZone(@PathVariable String elderlyId) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        return ResponseEntity.ok(locationService.getSafeZone(elderly));
    }

    @PutMapping("/caregiver/elderly-users/{elderlyId}/safe-zone")
    @PreAuthorize("hasRole('CAREGIVER')")
    public ResponseEntity<?> saveSafeZone(
            @PathVariable String elderlyId,
            @Valid @RequestBody SafeZoneRequest request) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        return ResponseEntity.ok(locationService.saveSafeZone(elderly, request));
    }

    @GetMapping("/caregiver/elderly-users/{elderlyId}/location/status")
    @PreAuthorize("hasRole('CAREGIVER')")
    public ResponseEntity<?> getLocationStatus(@PathVariable String elderlyId) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        return ResponseEntity.ok(locationService.getStatus(elderly));
    }

    @GetMapping("/caregiver/elderly-users/{elderlyId}/location/alerts")
    @PreAuthorize("hasRole('CAREGIVER')")
    public ResponseEntity<?> getLocationAlerts(@PathVariable String elderlyId) {
        User elderly = caregiverAccessService.validateAndGetElderly(getEmail(), elderlyId);
        return ResponseEntity.ok(locationService.getAlerts(elderly));
    }
}
