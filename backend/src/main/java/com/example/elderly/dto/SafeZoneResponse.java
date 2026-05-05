package com.example.elderly.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SafeZoneResponse {
    private String elderId;
    private Double homeLat;
    private Double homeLng;
    private Integer radiusMeters;
    private LocalDateTime updatedAt;
}
