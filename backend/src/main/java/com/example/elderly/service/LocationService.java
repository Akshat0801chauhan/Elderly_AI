package com.example.elderly.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.elderly.dto.LocationAlertResponse;
import com.example.elderly.dto.LocationStatusResponse;
import com.example.elderly.dto.LocationUpdateRequest;
import com.example.elderly.dto.SafeZoneRequest;
import com.example.elderly.dto.SafeZoneResponse;
import com.example.elderly.model.CaregiverAssignment;
import com.example.elderly.model.ElderLocationState;
import com.example.elderly.model.LocationAlert;
import com.example.elderly.model.LocationAlertType;
import com.example.elderly.model.LocationStatus;
import com.example.elderly.model.Role;
import com.example.elderly.model.SafeZone;
import com.example.elderly.model.User;
import com.example.elderly.repo.CaregiverAssignmentRepository;
import com.example.elderly.repo.ElderLocationStateRepository;
import com.example.elderly.repo.LocationAlertRepository;
import com.example.elderly.repo.SafeZoneRepository;
import com.example.elderly.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LocationService {
    private static final int REQUIRED_OUTSIDE_READINGS = 3;
    private static final Duration REQUIRED_OUTSIDE_DURATION = Duration.ofMinutes(2);

    private final UserRepository userRepository;
    private final SafeZoneRepository safeZoneRepository;
    private final ElderLocationStateRepository stateRepository;
    private final LocationAlertRepository alertRepository;
    private final CaregiverAssignmentRepository caregiverAssignmentRepository;
    private final SmsService smsService;

    public SafeZoneResponse saveSafeZone(User elder, SafeZoneRequest request) {
        SafeZone safeZone = safeZoneRepository.findByElder(elder).orElseGet(SafeZone::new);
        if (safeZone.getId() == null) {
            safeZone.setElder(elder);
            safeZone.setCreatedAt(LocalDateTime.now());
        }
        safeZone.setHomeLat(request.getHomeLat());
        safeZone.setHomeLng(request.getHomeLng());
        safeZone.setRadiusMeters(request.getRadiusMeters());
        safeZone.setUpdatedAt(LocalDateTime.now());
        return toSafeZoneResponse(safeZoneRepository.save(safeZone));
    }

    public SafeZoneResponse getSafeZone(User elder) {
        return safeZoneRepository.findByElder(elder)
                .map(this::toSafeZoneResponse)
                .orElse(null);
    }

    public LocationStatusResponse updateElderLocation(String elderEmail, LocationUpdateRequest request) {
        User elder = userRepository.findByEmail(elderEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (elder.getRole() != Role.ELDERLY) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only elderly users can update location");
        }

        ElderLocationState state = stateRepository.findByElder(elder).orElseGet(() -> newState(elder));
        LocalDateTime now = LocalDateTime.now();
        state.setLastLat(request.getLat());
        state.setLastLng(request.getLng());
        state.setLastSeenAt(now);
        state.setUpdatedAt(now);

        SafeZone safeZone = safeZoneRepository.findByElder(elder).orElse(null);
        if (safeZone == null) {
            state.setStatus(LocationStatus.NO_SAFE_ZONE);
            state.setLastDistanceMeters(null);
            stateRepository.save(state);
            return toStatusResponse(state, null);
        }

        double distanceMeters = haversineMeters(
                request.getLat(),
                request.getLng(),
                safeZone.getHomeLat(),
                safeZone.getHomeLng());
        boolean outside = distanceMeters > safeZone.getRadiusMeters();
        state.setLastDistanceMeters(distanceMeters);
        state.setStatus(outside ? LocationStatus.OUTSIDE : LocationStatus.SAFE);

        if (outside) {
            if (state.getOutsideReadingCount() == 0 || state.getOutsideSince() == null) {
                state.setOutsideSince(now);
            }
            state.setOutsideReadingCount(state.getOutsideReadingCount() + 1);
            boolean longEnough = !state.getOutsideSince().plus(REQUIRED_OUTSIDE_DURATION).isAfter(now);
            boolean enoughReadings = state.getOutsideReadingCount() >= REQUIRED_OUTSIDE_READINGS;
            if (!state.isAlertActive() && longEnough && enoughReadings) {
                createAlert(elder, state, LocationAlertType.OUTSIDE_SAFE_ZONE);
                state.setAlertActive(true);
                state.setLastAlertAt(now);
            }
        } else {
            if (state.isAlertActive()) {
                createAlert(elder, state, LocationAlertType.SAFE_NOW);
            }
            state.setOutsideReadingCount(0);
            state.setOutsideSince(null);
            state.setAlertActive(false);
        }

        return toStatusResponse(stateRepository.save(state), safeZone);
    }

    public LocationStatusResponse getStatus(User elder) {
        SafeZone safeZone = safeZoneRepository.findByElder(elder).orElse(null);
        ElderLocationState state = stateRepository.findByElder(elder).orElseGet(() -> newState(elder));
        if (safeZone == null && state.getStatus() != LocationStatus.NO_SAFE_ZONE) {
            state.setStatus(LocationStatus.NO_SAFE_ZONE);
            state = stateRepository.save(state);
        }
        return toStatusResponse(state, safeZone);
    }

    public List<LocationAlertResponse> getAlerts(User elder) {
        return alertRepository.findTop10ByElderOrderByCreatedAtDesc(elder)
                .stream()
                .map(this::toAlertResponse)
                .toList();
    }

    private void createAlert(User elder, ElderLocationState state, LocationAlertType type) {
        CaregiverAssignment assignment = caregiverAssignmentRepository.findByElderlyId(elder.getId()).orElse(null);
        User caregiver = assignment == null ? null : assignment.getCaregiver();
        String message = buildMessage(elder, state, type);
        String smsStatus = caregiver == null
                ? "Skipped: no caregiver assigned"
                : smsService.sendSms(caregiver.getPhone(), message);

        LocationAlert alert = new LocationAlert();
        alert.setElder(elder);
        alert.setCaregiver(caregiver);
        alert.setType(type);
        alert.setMessage(message);
        alert.setLat(state.getLastLat());
        alert.setLng(state.getLastLng());
        alert.setDistanceMeters(state.getLastDistanceMeters());
        alert.setSmsSent("Sent".equalsIgnoreCase(smsStatus));
        alert.setSmsStatus(smsStatus);
        alert.setCreatedAt(LocalDateTime.now());
        alertRepository.save(alert);
    }

    private String buildMessage(User elder, ElderLocationState state, LocationAlertType type) {
        String elderName = elder.getName() == null || elder.getName().isBlank() ? "The elder" : elder.getName();
        if (type == LocationAlertType.SAFE_NOW) {
            return elderName + " is back inside the safe zone.";
        }
        long distance = Math.round(state.getLastDistanceMeters() == null ? 0 : state.getLastDistanceMeters());
        return "Alert: " + elderName + " is outside the safe zone. Current distance from home is about "
                + distance + " meters.";
    }

    private ElderLocationState newState(User elder) {
        ElderLocationState state = new ElderLocationState();
        state.setElder(elder);
        state.setStatus(LocationStatus.NO_SAFE_ZONE);
        state.setUpdatedAt(LocalDateTime.now());
        return state;
    }

    private SafeZoneResponse toSafeZoneResponse(SafeZone safeZone) {
        return new SafeZoneResponse(
                safeZone.getElder().getId(),
                safeZone.getHomeLat(),
                safeZone.getHomeLng(),
                safeZone.getRadiusMeters(),
                safeZone.getUpdatedAt());
    }

    private LocationStatusResponse toStatusResponse(ElderLocationState state, SafeZone safeZone) {
        return new LocationStatusResponse(
                state.getElder().getId(),
                state.getStatus(),
                state.getLastLat(),
                state.getLastLng(),
                state.getLastDistanceMeters(),
                safeZone == null ? null : safeZone.getRadiusMeters(),
                state.getLastSeenAt(),
                state.getOutsideReadingCount(),
                state.isAlertActive());
    }

    private LocationAlertResponse toAlertResponse(LocationAlert alert) {
        return new LocationAlertResponse(
                alert.getId(),
                alert.getType(),
                alert.getMessage(),
                alert.getDistanceMeters(),
                alert.isSmsSent(),
                alert.getSmsStatus(),
                alert.getCreatedAt());
    }

    private double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        final double earthRadiusMeters = 6371000;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMeters * c;
    }
}
