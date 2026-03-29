package com.example.elderly.dto;

import jakarta.validation.constraints.NotBlank;
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
}