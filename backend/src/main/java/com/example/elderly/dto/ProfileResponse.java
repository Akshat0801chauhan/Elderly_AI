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
}
