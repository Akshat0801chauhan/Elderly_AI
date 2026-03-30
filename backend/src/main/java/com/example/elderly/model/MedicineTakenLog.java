package com.example.elderly.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "medicine_taken_log",
    uniqueConstraints = @UniqueConstraint(columnNames = {"medicine_id", "log_date"})
)
public class MedicineTakenLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    private Medicine medicine;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(nullable = false)
    private boolean taken = false;
}