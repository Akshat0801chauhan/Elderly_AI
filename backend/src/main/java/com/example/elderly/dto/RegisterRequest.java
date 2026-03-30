package com.example.elderly.dto;

import lombok.Data;

@Data
public class RegisterRequest {

    private String name;
    private String email;
    private String password;
    private String role;
    private String phone;
    private String address;
    private String imageUrl;
}