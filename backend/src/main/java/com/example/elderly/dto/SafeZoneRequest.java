package com.example.elderly.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SafeZoneRequest {
    @NotNull
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double homeLat;

    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double homeLng;

    @NotNull
    @Min(50)
    @Max(5000)
    private Integer radiusMeters;
}
