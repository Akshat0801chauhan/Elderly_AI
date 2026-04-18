package com.example.elderly.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.elderly.dto.FaceResponse;
import com.example.elderly.service.FaceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ai/face")
@RequiredArgsConstructor
public class AiFaceController {

    private final FaceService faceService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(faceService.healthCheck());
    }

    @GetMapping("/faces")
    public ResponseEntity<Map<String, Object>> listFaces() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(Map.of("faces", faceService.listFaces(email)));
    }

    @GetMapping("/faces/{slug}/image")
    public ResponseEntity<byte[]> getFaceImage(@PathVariable String slug) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return faceService.getFaceImage(email, slug);
    }

    @PostMapping("/enroll")
    public ResponseEntity<FaceResponse> enrollFace(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "relation", required = false) String relation,
            @RequestParam("image") MultipartFile image
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(faceService.enrollFace(email, name, relation, image));
    }

    @PostMapping("/recognize")
    public ResponseEntity<Map<String, Object>> recognizeFace(@RequestParam("image") MultipartFile image) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(faceService.recognizeFace(email, image));
    }

    @PutMapping("/faces/{slug}")
    public ResponseEntity<Void> updateFace(
            @PathVariable String slug,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "relation", required = false) String relation
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        faceService.updateFace(email, slug, name, relation);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/faces/{slug}")
    public ResponseEntity<Void> deleteFace(@PathVariable String slug) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        faceService.deleteFace(email, slug);
        return ResponseEntity.ok().build();
    }
}