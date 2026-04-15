package com.example.elderly.model;

import java.time.LocalDateTime;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="activities")



public class Activity{
    @Id
    @GeneratedValue(strategy=GenerationType.UUID)
    private String id;
    @Column(nullable=false)
    private String title;
    @Column(length = 1000)
    private String description;
    @JsonFormat(pattern = "HH:mm")
    @Column(nullable = false)
    private LocalTime time;

    @Column(nullable = false)
    private boolean isMandatory = true;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(optional = false)
    private User elder;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

}