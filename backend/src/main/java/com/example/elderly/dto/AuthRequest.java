package com.example.elderly.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
}
