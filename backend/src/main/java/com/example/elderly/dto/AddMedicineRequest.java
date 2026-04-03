package com.example.elderly.dto;

import com.example.elderly.model.Medicine.MealTiming;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddMedicineRequest {

    @NotBlank(message = "Medicine name is required")
    private String name;

    @NotBlank(message = "Dosage is required")
    private String dosage;

    private String breakfastTime;
    private String lunchTime;
    private String dinnerTime;

    private MealTiming breakfastTiming = MealTiming.NONE;
    private MealTiming lunchTiming = MealTiming.NONE;
    private MealTiming dinnerTiming = MealTiming.NONE;

    @NotNull(message = "Number of days is required")
    @Min(value = 1, message = "Number of days must be at least 1")
    private Integer numberOfDays = 1;

    private String startDate;

    private String notes;
}
