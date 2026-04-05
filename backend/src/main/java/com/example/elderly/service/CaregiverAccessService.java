package com.example.elderly.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.elderly.dto.LinkedElderlyResponse;
import com.example.elderly.model.Role;
import com.example.elderly.model.User;
import com.example.elderly.repo.CaregiverAssignmentRepository;
import com.example.elderly.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CaregiverAccessService {

    private final UserRepository userRepository;
    private final CaregiverAssignmentRepository caregiverAssignmentRepository;

    public User getCaregiverByEmail(String email) {
        User caregiver = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Caregiver not found"));

        if (caregiver.getRole() != Role.CAREGIVER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only caregivers can access this resource");
        }

        return caregiver;
    }

    public User validateAndGetElderly(String caregiverEmail, String elderlyId) {
        User caregiver = getCaregiverByEmail(caregiverEmail);

        User elderly = userRepository.findById(elderlyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Elderly user not found"));

        if (elderly.getRole() != Role.ELDERLY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user is not an elderly user");
        }

        boolean allowed = caregiverAssignmentRepository.existsByCaregiverIdAndElderlyId(caregiver.getId(), elderlyId);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this elderly user");
        }

        return elderly;
    }

    public List<LinkedElderlyResponse> getLinkedElderlyUsers(String caregiverEmail) {
        User caregiver = getCaregiverByEmail(caregiverEmail);

        return caregiverAssignmentRepository.findByCaregiverId(caregiver.getId())
                .stream()
                .map(assignment -> assignment.getElderly())
                .map(elderly -> new LinkedElderlyResponse(
                        elderly.getId(),
                        elderly.getName(),
                        elderly.getEmail(),
                        elderly.getPhone()))
                .toList();
    }
}
