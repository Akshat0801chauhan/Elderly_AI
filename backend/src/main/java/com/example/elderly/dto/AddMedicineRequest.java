package com.example.elderly.dto;

import lombok.Data;

@Data
public class AddMedicineRequest {
    private String name;
    private String dosage;
    private String time; 
}

