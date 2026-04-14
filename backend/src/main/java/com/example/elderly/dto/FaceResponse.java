package com.example.elderly.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceResponse {
    private String id;
    private String slug;
    private String name;
    private String relation;
    private String imageUrl;
}
