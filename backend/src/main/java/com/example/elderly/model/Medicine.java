package com.example.elderly.model;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medicine {
     @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    private String dosage;

    private LocalTime time;

    private boolean taken;

    private LocalDate date;

    @ManyToOne
    private User user;
}
