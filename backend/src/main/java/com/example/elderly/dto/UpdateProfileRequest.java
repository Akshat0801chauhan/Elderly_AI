package com.example.elderly.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    @NotBlank(message = "Address is required")
    private String address;

    private String imageUrl;
    private String dateOfBirth;
    private String gender;
    private String bloodType;
    private String allergies;
    private String chronicDiseases;
    private String pastIllnesses;
}
