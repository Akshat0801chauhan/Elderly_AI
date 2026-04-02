package com.example.elderly.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.elderly.dto.AuthRequest;
import com.example.elderly.dto.AuthResponse;
import com.example.elderly.dto.RegisterRequest;
import com.example.elderly.service.AuthService;
import com.example.elderly.service.TokenBlacklist;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController
 {   private final AuthService authService;

    private final TokenBlacklist tokenBlacklist;
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request)
    {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest authRequest)
    {
        return ResponseEntity.ok(authService.login(authRequest));
    }
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request)
    {
        String authHeader=request.getHeader("Authorization");

        if(authHeader!=null && authHeader.startsWith("Bearer ")){
         String token=authHeader.substring(7);
         tokenBlacklist.add(token);
        }
        return ResponseEntity.ok("Logged out successfully");
    }

}
