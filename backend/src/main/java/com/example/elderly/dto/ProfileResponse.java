package com.example.elderly.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProfileResponse {
    private String name;
    private String email;
    private String role;
    private String phone;
    private String address;
    private String imageUrl;
    private String dateOfBirth;
    private String gender;
    private String bloodType;
    private String allergies;
    private String chronicDiseases;
    private String pastIllnesses;
}
