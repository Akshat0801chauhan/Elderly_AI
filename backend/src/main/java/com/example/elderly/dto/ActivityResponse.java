package com.example.elderly.dto;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ActivityResponse {
    private String id;
    private String title;
    private String description;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime time;

    private boolean isMandatory;
    private boolean completed;
    private boolean missed;
}
