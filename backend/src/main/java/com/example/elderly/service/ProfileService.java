package com.example.elderly.service;

import org.springframework.stereotype.Service;

import com.example.elderly.dto.ProfileResponse;
import com.example.elderly.dto.UpdateProfileRequest;
import com.example.elderly.model.User;
import com.example.elderly.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserRepository userRepository;
    public ProfileResponse getProfile(String userId){
        User user=userRepository.findById(userId).orElseThrow(()->new RuntimeException("User not found"));
        return new ProfileResponse(
            user.getName(),
            user.getEmail(),
            user.getRole().name(),
                user.getPhone(),
                user.getAddress(),
                user.getImageUrl()

        );
    }

    public String updateProfile(String userId, UpdateProfileRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setImageUrl(request.getImageUrl());

        userRepository.save(user);

        return "Profile updated successfully";
    }

public ProfileResponse getProfileByEmail(String email) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    return new ProfileResponse(
            user.getName(),
            user.getEmail(),
            user.getRole().name(),
            user.getPhone(),
            user.getAddress(),
            user.getImageUrl()
    );
}
public String updateProfileByEmail(String email, UpdateProfileRequest request) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    user.setName(request.getName());
    user.setPhone(request.getPhone());
    user.setAddress(request.getAddress());
    user.setImageUrl(request.getImageUrl());

    userRepository.save(user);

    return "Profile updated successfully";
}
}