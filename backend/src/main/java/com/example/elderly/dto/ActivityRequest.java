package com.example.elderly.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ActivityRequest {
   @NotBlank(message="Title is required")
   private String title;
   private String description;
   @NotBlank(message="Time is required")
   private String time;
   @NotNull(message="isMandatory is required")
   private Boolean isMandatory;
   @NotBlank(message="elderId is required")
   private String elderId;
}
