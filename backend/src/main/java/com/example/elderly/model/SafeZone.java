package com.example.elderly.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "safe_zones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SafeZone {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(optional = false)
    @JoinColumn(name = "elder_id", nullable = false, unique = true)
    private User elder;

    @Column(nullable = false)
    private double homeLat;

    @Column(nullable = false)
    private double homeLng;

    @Column(nullable = false)
    private int radiusMeters;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
