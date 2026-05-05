package com.example.elderly.dto;

import java.time.LocalDateTime;

import com.example.elderly.model.LocationStatus;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LocationStatusResponse {
    private String elderId;
    private LocationStatus status;
    private Double lastLat;
    private Double lastLng;
    private Double distanceMeters;
    private Integer radiusMeters;
    private LocalDateTime lastSeenAt;
    private Integer outsideReadingCount;
    private Boolean alertActive;
}
