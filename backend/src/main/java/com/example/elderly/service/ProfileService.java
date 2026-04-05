package com.example.elderly.service;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

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

    validateProfileRequest(user, request);

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

private void validateProfileRequest(User user, UpdateProfileRequest request) {
    if (user.getRole() != Role.ELDERLY) {
        return;
    }

    requireField(request.getDateOfBirth(), "Date of birth is required for elderly users");
    requireField(request.getGender(), "Gender is required for elderly users");
    requireField(request.getBloodType(), "Blood type is required for elderly users");
    validateDateOfBirth(request.getDateOfBirth());
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

private void requireField(String value, String message) {
    if (value == null || value.trim().isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}

private void validateDateOfBirth(String value) {
    try {
        LocalDate dob = LocalDate.parse(value.trim());
        if (dob.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
        }
    } catch (DateTimeParseException ex) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth must be a valid date");
    }
}
public ProfileResponse getProfileForElderly(User elderly) {
    return new ProfileResponse(
            elderly.getName(),
            elderly.getEmail(),
            elderly.getRole().name(),
            elderly.getPhone(),
            elderly.getAddress(),
            elderly.getImageUrl(),
            elderly.getDateOfBirth(),
            elderly.getGender(),
            getHealthField(elderly, elderly.getBloodType()),
            getHealthField(elderly, elderly.getAllergies()),
            getHealthField(elderly, elderly.getChronicDiseases()),
            getHealthField(elderly, elderly.getPastIllnesses())
    );
}

public String updateProfileForElderly(User elderly, UpdateProfileRequest request) {
    validateProfileRequest(elderly, request);

    elderly.setName(request.getName().trim());
    elderly.setPhone(request.getPhone().trim());
    elderly.setAddress(request.getAddress().trim());
    elderly.setImageUrl(trimToNull(request.getImageUrl()));
    elderly.setDateOfBirth(trimToNull(request.getDateOfBirth()));
    elderly.setGender(trimToNull(request.getGender()));
    applyHealthFields(elderly, request);

    userRepository.save(elderly);
    return "Profile updated successfully";
}

}
