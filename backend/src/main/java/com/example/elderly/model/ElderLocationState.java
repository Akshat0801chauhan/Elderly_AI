package com.example.elderly.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "elder_location_states")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ElderLocationState {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(optional = false)
    @JoinColumn(name = "elder_id", nullable = false, unique = true)
    private User elder;

    private Double lastLat;
    private Double lastLng;
    private Double lastDistanceMeters;
    private LocalDateTime lastSeenAt;
    private LocalDateTime outsideSince;

    @Column(nullable = false)
    private int outsideReadingCount = 0;

    @Column(nullable = false)
    private boolean alertActive = false;

    private LocalDateTime lastAlertAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationStatus status = LocationStatus.NO_SAFE_ZONE;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
