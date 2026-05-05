package com.example.elderly.dto;

import java.time.LocalDateTime;

import com.example.elderly.model.LocationAlertType;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LocationAlertResponse {
    private String id;
    private LocationAlertType type;
    private String message;
    private Double distanceMeters;
    private Boolean smsSent;
    private String smsStatus;
    private LocalDateTime createdAt;
}
