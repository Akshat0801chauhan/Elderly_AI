package com.example.elderly.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name="caregiver_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaregiverAssignment {
    @Id
    @GeneratedValue(strategy=GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name="caregiver_id",nullable=false)
    private User caregiver;

    @ManyToOne
    @JoinColumn(name="elderly_id",nullable=false,unique=true)
    private User elderly;

    @Column(nullable=false)
    private LocalDateTime createdAt=LocalDateTime.now();
}
