package com.example.elderly.model;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    @JsonFormat(pattern = "HH:mm")
    private LocalTime time;

    private boolean taken = false;

    private LocalDate date = LocalDate.now();

    @ManyToOne
    private User user;

    // ── NEW FIELDS ───────────────────────────────────────

    // No columnDefinition — plain @Column only, avoids PostgreSQL ALTER COLUMN syntax error
    @Enumerated(EnumType.STRING)
    @Column(name = "breakfast_timing", length = 10)
    private MealTiming breakfastTiming = MealTiming.NONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "lunch_timing", length = 10)
    private MealTiming lunchTiming = MealTiming.NONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "dinner_timing", length = 10)
    private MealTiming dinnerTiming = MealTiming.NONE;

    @Column(name = "number_of_days")
    private int numberOfDays = 1;

    @Column(name = "start_date")
    private LocalDate startDate = LocalDate.now();

    private String notes;

    // ── ENUM ─────────────────────────────────────────────

    public enum MealTiming {
        BEFORE, AFTER, NONE
    }
}