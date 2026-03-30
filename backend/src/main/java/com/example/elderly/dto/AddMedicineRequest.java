package com.example.elderly.dto;

import com.example.elderly.model.Medicine.MealTiming;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AddMedicineRequest {

    @NotBlank(message = "Medicine name is required")
    private String name;

    @NotBlank(message = "Dosage is required")
    private String dosage;

    @NotBlank(message = "Time is required")
    @Pattern(
        regexp = "^([01]\\d|2[0-3]):([0-5]\\d)$",
        message = "Time must be in HH:mm format (e.g. 14:30)"
    )
    private String time;

    // ── NEW FIELDS ───────────────────────────────────────

    // Defaults to NONE if not provided
    private MealTiming breakfastTiming = MealTiming.NONE;
    private MealTiming lunchTiming     = MealTiming.NONE;
    private MealTiming dinnerTiming    = MealTiming.NONE;

    @NotNull(message = "Number of days is required")
    @Min(value = 1, message = "Number of days must be at least 1")
    private Integer numberOfDays = 1;

    // Optional - defaults to today in the entity
    private String startDate;

    private String notes;
}