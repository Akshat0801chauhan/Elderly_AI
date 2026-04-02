package com.example.elderly.service;

import org.springframework.stereotype.Service;

import com.example.elderly.dto.ProfileResponse;
import com.example.elderly.dto.UpdateProfileRequest;
import com.example.elderly.model.Role;
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
            user.getImageUrl(),
            user.getDateOfBirth(),
            user.getGender(),
            getHealthField(user, user.getBloodType()),
            getHealthField(user, user.getAllergies()),
            getHealthField(user, user.getChronicDiseases()),
            getHealthField(user, user.getPastIllnesses())

        );
    }

    public String updateProfile(String userId, UpdateProfileRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(request.getName().trim());
        user.setPhone(request.getPhone().trim());
        user.setAddress(request.getAddress().trim());
        user.setImageUrl(trimToNull(request.getImageUrl()));
        user.setDateOfBirth(trimToNull(request.getDateOfBirth()));
        user.setGender(trimToNull(request.getGender()));
        applyHealthFields(user, request);

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
            user.getImageUrl(),
            user.getDateOfBirth(),
            user.getGender(),
            getHealthField(user, user.getBloodType()),
            getHealthField(user, user.getAllergies()),
            getHealthField(user, user.getChronicDiseases()),
            getHealthField(user, user.getPastIllnesses())
    );
}
public String updateProfileByEmail(String email, UpdateProfileRequest request) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    user.setName(request.getName().trim());
    user.setPhone(request.getPhone().trim());
    user.setAddress(request.getAddress().trim());
    user.setImageUrl(trimToNull(request.getImageUrl()));
    user.setDateOfBirth(trimToNull(request.getDateOfBirth()));
    user.setGender(trimToNull(request.getGender()));
    applyHealthFields(user, request);

    userRepository.save(user);

    return "Profile updated successfully";
}

private void applyHealthFields(User user, UpdateProfileRequest request) {
    if (user.getRole() == Role.ELDERLY) {
        user.setBloodType(trimToNull(request.getBloodType()));
        user.setAllergies(trimToNull(request.getAllergies()));
        user.setChronicDiseases(trimToNull(request.getChronicDiseases()));
        user.setPastIllnesses(trimToNull(request.getPastIllnesses()));
        return;
    }

    user.setBloodType(null);
    user.setAllergies(null);
    user.setChronicDiseases(null);
    user.setPastIllnesses(null);
}

private String getHealthField(User user, String value) {
    return user.getRole() == Role.ELDERLY ? value : null;
}

private String trimToNull(String value) {
    if (value == null) {
        return null;
    }

    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
}
}
