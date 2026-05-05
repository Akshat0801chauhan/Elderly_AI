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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "location_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "elder_id", nullable = false)
    private User elder;

    @ManyToOne
    @JoinColumn(name = "caregiver_id")
    private User caregiver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationAlertType type;

    @Column(nullable = false, length = 600)
    private String message;

    private Double lat;
    private Double lng;
    private Double distanceMeters;

    @Column(nullable = false)
    private boolean smsSent = false;

    private String smsStatus;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
