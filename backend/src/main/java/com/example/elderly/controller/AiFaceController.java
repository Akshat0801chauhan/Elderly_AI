package com.example.elderly.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.elderly.service.AiFaceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ai/face")
@RequiredArgsConstructor
public class AiFaceController {

    private final AiFaceService aiFaceService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(aiFaceService.healthCheck());
    }

    @GetMapping("/faces")
    public ResponseEntity<Map<String, Object>> listFaces() {
        return ResponseEntity.ok(aiFaceService.listFaces());
    }

    @GetMapping("/faces/{slug}/image")
    public ResponseEntity<byte[]> getFaceImage(@PathVariable String slug) {
        return aiFaceService.getFaceImage(slug);
    }

    @PostMapping("/enroll")
    public ResponseEntity<Map<String, Object>> enrollFace(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "relation", required = false) String relation,
            @RequestParam("image") MultipartFile image
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(aiFaceService.enrollFace(email, name, relation, image));
    }

    @PostMapping("/recognize")
    public ResponseEntity<Map<String, Object>> recognizeFace(@RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(aiFaceService.recognizeFace(image));
    }
}
