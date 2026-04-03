package com.example.elderly.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

import com.example.elderly.dto.AuthRequest;
import com.example.elderly.dto.AuthResponse;
import com.example.elderly.dto.RegisterRequest;
import com.example.elderly.model.Role;
import com.example.elderly.model.User;
import com.example.elderly.repo.UserRepository;
import com.example.elderly.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor
public class AuthService {
    private final BCryptPasswordEncoder encoder;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;



    

public AuthResponse login(AuthRequest request)
{
    User user = userRepository.findByEmail(request.getEmail().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

    if(!encoder.matches(request.getPassword(),user.getPassword())){
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token);

}
public AuthResponse register(RegisterRequest request) {
    String email = request.getEmail().trim();
    Role role = parseRole(request.getRole());
    validateRoleSpecificFields(request, role);

    if(userRepository.findByEmail(email).isPresent()) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists");
    }

    User user = new User();
    user.setName(request.getName().trim());
    user.setEmail(email);
    user.setPassword(encoder.encode(request.getPassword()));
    user.setRole(role);
    user.setPhone(request.getPhone().trim());
    user.setAddress(request.getAddress().trim());
    user.setImageUrl(trimToNull(request.getImageUrl()));
    user.setDateOfBirth(trimToNull(request.getDateOfBirth()));
    user.setGender(trimToNull(request.getGender()));
    user.setBloodType(role == Role.ELDERLY ? trimToNull(request.getBloodType()) : null);
    user.setAllergies(role == Role.ELDERLY ? trimToNull(request.getAllergies()) : null);
    user.setChronicDiseases(role == Role.ELDERLY ? trimToNull(request.getChronicDiseases()) : null);
    user.setPastIllnesses(role == Role.ELDERLY ? trimToNull(request.getPastIllnesses()) : null);

    userRepository.save(user);

    
    String token = jwtUtil.generateToken(user.getEmail());

    return new AuthResponse(token);
}

private Role parseRole(String roleValue) {
    try {
        return Role.valueOf(roleValue.trim().toUpperCase());
    } catch (IllegalArgumentException | NullPointerException ex) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ELDERLY or CAREGIVER");
    }
}

private void validateRoleSpecificFields(RegisterRequest request, Role role) {
    if (role != Role.ELDERLY) {
        return;
    }

    requireField(request.getDateOfBirth(), "Date of birth is required for elderly users");
    requireField(request.getGender(), "Gender is required for elderly users");
    requireField(request.getBloodType(), "Blood type is required for elderly users");
    requireField(request.getAllergies(), "Allergies are required for elderly users");
    requireField(request.getChronicDiseases(), "Chronic diseases are required for elderly users");
    requireField(request.getPastIllnesses(), "Past illnesses are required for elderly users");
    validateDateOfBirth(request.getDateOfBirth());
}

private void requireField(String value, String message) {
    if (value == null || value.trim().isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}

private String trimToNull(String value) {
    if (value == null) {
        return null;
    }

    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
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



}
