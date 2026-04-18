package com.example.elderly.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.elderly.dto.FaceResponse;
import com.example.elderly.model.Face;
import com.example.elderly.model.User;
import com.example.elderly.repo.FaceRepository;
import com.example.elderly.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FaceService {

    private final FaceRepository faceRepository;
    private final UserRepository userRepository;
    private final AiFaceService aiFaceService;

    public List<FaceResponse> listFaces(String email) {
        User user = findUserByEmail(email);
        return faceRepository.findAllByUser(user).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Map<String, Object> healthCheck() {
        return aiFaceService.healthCheck();
    }

    public FaceResponse enrollFace(String email, String name, String relation, MultipartFile image) {
        User user = findUserByEmail(email);
        Map<String, Object> aiResponse = aiFaceService.enrollFace(email, name, relation, image);

        String slug = aiResponse.get("slug") != null ? String.valueOf(aiResponse.get("slug")) : null;
        if (slug == null || slug.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not enroll face: missing slug from AI service.");
        }

        String resolvedName = name != null && !name.isBlank() ? name.trim() : user.getName();
        if (resolvedName == null || resolvedName.isBlank()) {
            resolvedName = user.getEmail().split("@")[0];
        }

        String imageUrl = "/api/ai/face/faces/" + slug + "/image";

        // Update existing face if slug already exists, otherwise create new
        Face face = faceRepository.findBySlugAndUser(slug, user).orElse(new Face());
        face.setSlug(slug);
        face.setName(resolvedName);
        face.setRelation(relation != null ? relation.trim() : null);
        face.setImageUrl(imageUrl);
        face.setUser(user);
        faceRepository.save(face);

        return toResponse(face);
    }

    public Map<String, Object> recognizeFace(String email, MultipartFile image) {
        Map<String, Object> aiResponse = aiFaceService.recognizeFace(email, image);

        // Enrich the response with imageUrl so the frontend can display the matched face
        if (Boolean.TRUE.equals(aiResponse.get("recognized"))) {
            Object nameObj = aiResponse.get("name");
            if (nameObj != null) {
                String matchedName = String.valueOf(nameObj);
                User user = findUserByEmail(email);
                faceRepository.findAllByUser(user).stream()
                        .filter(f -> f.getName() != null &&
                                f.getName().equalsIgnoreCase(matchedName))
                        .findFirst()
                        .ifPresent(face -> {
                            aiResponse.put("slug", face.getSlug());
                            aiResponse.put("relation", face.getRelation() != null ? face.getRelation() : "");
                            aiResponse.put("imageUrl", face.getImageUrl());
                        });
            }
        }

        return aiResponse;
    }

    public ResponseEntity<byte[]> getFaceImage(String email, String slug) {
        User user = findUserByEmail(email);
        faceRepository.findBySlugAndUser(slug, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Face not found."));
        return aiFaceService.getFaceImage(slug, email);
    }

    public void updateFace(String email, String slug, String name, String relation) {
        User user = findUserByEmail(email);
        Face face = faceRepository.findBySlugAndUser(slug, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Face not found."));

        if (name != null && !name.isBlank()) {
            face.setName(name.trim());
        }
        if (relation != null) {
            face.setRelation(relation.trim().isEmpty() ? null : relation.trim());
        }

        faceRepository.save(face);
        aiFaceService.updateFace(slug, email, face.getName(), face.getRelation());
    }

    public void deleteFace(String email, String slug) {
        User user = findUserByEmail(email);
        Face face = faceRepository.findBySlugAndUser(slug, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Face not found."));

        faceRepository.delete(face);
        aiFaceService.deleteFace(slug, email);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private FaceResponse toResponse(Face face) {
        return new FaceResponse(
                face.getId(),
                face.getSlug(),
                face.getName(),
                face.getRelation(),
                face.getImageUrl()
        );
    }
}