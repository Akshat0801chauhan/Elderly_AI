package com.example.elderly.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ActivityProgressResponse {
    private long completed;
    private long total;
}
