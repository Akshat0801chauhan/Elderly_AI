package com.example.elderly.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.elderly.service.ChatService;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    private String getEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
        try {
            String message = (String) body.get("message");

            
            Object voiceObj = body.get("voice");
boolean voice = false;

if (voiceObj instanceof Boolean) {
    voice = (Boolean) voiceObj;
}

            if (message == null || message.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
            }

            String response = chatService.chat(getEmail(), message, voice);
            return ResponseEntity.ok(Map.of("response", response));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}