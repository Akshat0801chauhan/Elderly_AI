package com.example.elderly.controller;

import java.util.Map;

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

import com.example.elderly.dto.ActivityRequest;
import com.example.elderly.service.ActivityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    private String getEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return auth.getName();
    }

    @PostMapping
    @PreAuthorize("hasRole('CAREGIVER')")
    public ResponseEntity<?> addActivity(@Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.status(201).body(activityService.addActivity(getEmail(), request));
    }

    @GetMapping("/today")
    @PreAuthorize("hasRole('ELDERLY')")
    public ResponseEntity<?> getTodayActivities() {
        return ResponseEntity.ok(activityService.getTodayActivities(getEmail()));
    }

    @PutMapping("/complete/{id}")
    @PreAuthorize("hasRole('ELDERLY')")
    public ResponseEntity<?> completeActivity(@PathVariable String id) {
        return ResponseEntity.ok(activityService.markComplete(id, getEmail()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CAREGIVER')")
    public ResponseEntity<?> deleteActivity(@PathVariable String id) {
        activityService.deleteActivity(getEmail(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CAREGIVER')")
    public ResponseEntity<?> updateActivity(
            @PathVariable String id,
            @Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.ok(activityService.updateActivity(getEmail(), id, request));
    }

    @GetMapping("/progress")
    @PreAuthorize("hasRole('ELDERLY')")
    public ResponseEntity<?> getProgress() {
        return ResponseEntity.ok(activityService.getTodayProgress(getEmail()));
    }

    @GetMapping("/elder/{elderId}")
    @PreAuthorize("hasRole('CAREGIVER')")
    public ResponseEntity<Map<String, Object>> getElderActivityView(@PathVariable String elderId) {
        return ResponseEntity.ok(activityService.getElderActivityView(getEmail(), elderId));
    }

    @GetMapping("/missed/{elderId}")
    @PreAuthorize("hasRole('CAREGIVER')")
    public ResponseEntity<?> getMissedActivities(@PathVariable String elderId) {
        return ResponseEntity.ok(activityService.getMissedActivities(getEmail(), elderId));
    }
}
