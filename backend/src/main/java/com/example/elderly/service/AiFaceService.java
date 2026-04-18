package com.example.elderly.service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.elderly.model.User;
import com.example.elderly.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiFaceService {
    private static final Pattern DETAIL_MSG_PATTERN = Pattern.compile("\"msg\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern DETAIL_FIELD_PATTERN = Pattern.compile("\"loc\"\\s*:\\s*\\[[^\\]]*\"([^\"]+)\"\\]");

    private final UserRepository userRepository;

    @Value("${ai.service.base-url:http://127.0.0.1:8000}")
    private String aiServiceBaseUrl;

    public Map<String, Object> healthCheck() {
        try {
            return restTemplate().exchange(
                    aiServiceBaseUrl + "/health",
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            ).getBody();
        } catch (HttpStatusCodeException ex) {
            throw downstreamException(ex);
        } catch (Exception ex) {
            throw unavailableException(ex);
        }
    }

    public Map<String, Object> listFaces(String userEmail) {
        try {
            String url = aiServiceBaseUrl + "/faces";
            if (userEmail != null && !userEmail.isBlank()) {
                url += "?user_email=" + URLEncoder.encode(userEmail, StandardCharsets.UTF_8);
            }

            Map<String, Object> response = restTemplate().exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            ).getBody();

            Object facesObject = response != null ? response.get("faces") : null;
            List<Map<String, Object>> normalizedFaces = new ArrayList<>();

            if (facesObject instanceof List<?> faceList) {
                for (Object item : faceList) {
                    if (item instanceof Map<?, ?> rawFace) {
                        String name = stringValue(rawFace.get("name"));
                        String slug = stringValue(rawFace.get("slug"));
                        String imageUrl = stringValue(rawFace.get("image_url"));
                        String relation = stringValue(rawFace.get("relation"));

                        Map<String, Object> normalizedFace = new LinkedHashMap<>();
                        normalizedFace.put("name", name);
                        normalizedFace.put("slug", slug);
                        normalizedFace.put(
                                "imageUrl",
                                imageUrl != null && slug != null
                                        ? "/api/ai/face/faces/" + slug + "/image"
                                        : null
                        );
                        normalizedFace.put("relation", relation);
                        normalizedFaces.add(normalizedFace);
                    }
                }
            }

            return Map.of("faces", normalizedFaces);
        } catch (HttpStatusCodeException ex) {
            throw downstreamException(ex);
        } catch (Exception ex) {
            throw unavailableException(ex);
        }
    }

    public Map<String, Object> enrollFace(String email, String requestedName, String requestedRelation, MultipartFile image) {
        validateImage(image);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String resolvedName = normalizeName(requestedName, user);
        MultiValueMap<String, HttpEntity<?>> body = multipartBody(image, resolvedName, requestedRelation, email);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, HttpEntity<?>>> request = new HttpEntity<>(body, headers);

        try {
            return restTemplate().exchange(
                    aiServiceBaseUrl + "/enroll",
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            ).getBody();
        } catch (HttpStatusCodeException ex) {
            throw downstreamException(ex);
        } catch (Exception ex) {
            throw unavailableException(ex);
        }
    }

    public Map<String, Object> recognizeFace(String userEmail, MultipartFile image) {
        validateImage(image);

        try {
            MultiValueMap<String, HttpEntity<?>> body = multipartBody(image, null, null, userEmail);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, HttpEntity<?>>> request = new HttpEntity<>(body, headers);

            return restTemplate().exchange(
                    aiServiceBaseUrl + "/recognize",
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            ).getBody();
        } catch (HttpStatusCodeException ex) {
            throw downstreamException(ex);
        } catch (Exception ex) {
            throw unavailableException(ex);
        }
    }

    public ResponseEntity<byte[]> getFaceImage(String slug, String userEmail) {
        try {
            // The backend already authorizes the user and verifies face ownership.
            // For image proxying, we do not need to pass user_email to the AI service.
            String url = aiServiceBaseUrl + "/faces/" + slug + "/image";

            ResponseEntity<byte[]> response = restTemplate().exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    byte[].class
            );

            HttpHeaders headers = new HttpHeaders();
            MediaType contentType = response.getHeaders().getContentType();
            headers.setContentType(contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM);
            if (response.getHeaders().getContentLength() >= 0) {
                headers.setContentLength(response.getHeaders().getContentLength());
            }
            if (response.getHeaders().containsHeader(HttpHeaders.CONTENT_DISPOSITION)) {
                headers.put(HttpHeaders.CONTENT_DISPOSITION, response.getHeaders().get(HttpHeaders.CONTENT_DISPOSITION));
            }
            if (response.getHeaders().containsHeader(HttpHeaders.CACHE_CONTROL)) {
                headers.put(HttpHeaders.CACHE_CONTROL, response.getHeaders().get(HttpHeaders.CACHE_CONTROL));
            }
            return new ResponseEntity<>(response.getBody(), headers, response.getStatusCode());
        } catch (HttpStatusCodeException ex) {
            throw downstreamException(ex);
        } catch (Exception ex) {
            throw unavailableException(ex);
        }
    }

    public void updateFace(String slug, String userEmail, String name, String relation) {
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            if (name != null && !name.isBlank()) {
                body.add("name", name.trim());
            }
            if (relation != null) {
                body.add("relation", relation.trim().isEmpty() ? null : relation.trim());
            }
            body.add("user_email", userEmail);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            restTemplate().exchange(
                    aiServiceBaseUrl + "/faces/" + slug,
                    HttpMethod.PUT,
                    request,
                    Void.class
            );
        } catch (HttpStatusCodeException ex) {
            throw downstreamException(ex);
        } catch (Exception ex) {
            throw unavailableException(ex);
        }
    }

    public void deleteFace(String slug, String userEmail) {
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("user_email", userEmail);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            restTemplate().exchange(
                    aiServiceBaseUrl + "/faces/" + slug,
                    HttpMethod.DELETE,
                    request,
                    Void.class
            );
        } catch (HttpStatusCodeException ex) {
            throw downstreamException(ex);
        } catch (Exception ex) {
            throw unavailableException(ex);
        }
    }

    private RestTemplate restTemplate() {
        return new RestTemplate();
    }

    private MultiValueMap<String, HttpEntity<?>> multipartBody(MultipartFile image, String name, String relation, String userEmail) {
        try {
            String filename = image.getOriginalFilename() != null ? image.getOriginalFilename() : "face-upload.jpg";
            MultiValueMap<String, HttpEntity<?>> body = new LinkedMultiValueMap<>();

            HttpHeaders imageHeaders = new HttpHeaders();
            imageHeaders.setContentType(resolveMediaType(image.getContentType()));
            imageHeaders.setContentDisposition(ContentDisposition.formData()
                    .name("image")
                    .filename(filename)
                    .build());

            body.add("image", new HttpEntity<>(
                    new NamedByteArrayResource(image.getBytes(), filename),
                    imageHeaders
            ));

            if (name != null && !name.isBlank()) {
                HttpHeaders nameHeaders = new HttpHeaders();
                nameHeaders.setContentDisposition(ContentDisposition.formData().name("name").build());
                body.add("name", new HttpEntity<>(name, nameHeaders));
            }

            if (relation != null && !relation.isBlank()) {
                HttpHeaders relationHeaders = new HttpHeaders();
                relationHeaders.setContentDisposition(ContentDisposition.formData().name("relation").build());
                body.add("relation", new HttpEntity<>(relation, relationHeaders));
            }

            if (userEmail != null && !userEmail.isBlank()) {
                HttpHeaders emailHeaders = new HttpHeaders();
                emailHeaders.setContentDisposition(ContentDisposition.formData().name("user_email").build());
                body.add("user_email", new HttpEntity<>(userEmail, emailHeaders));
            }

            return body;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded image");
        }
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose an image first.");
        }
    }

    private String normalizeName(String requestedName, User user) {
        if (requestedName != null && !requestedName.trim().isEmpty()) {
            return requestedName.trim();
        }
        if (user.getName() != null && !user.getName().trim().isEmpty()) {
            return user.getName().trim();
        }
        return user.getEmail().split("@")[0];
    }

    private ResponseStatusException downstreamException(HttpStatusCodeException ex) {
        String body = ex.getResponseBodyAsString(StandardCharsets.UTF_8);
        String message = body != null && !body.isBlank() ? body : ex.getStatusText();

        if (body != null && body.contains("\"detail\"") && body.contains("\"msg\"")) {
            message = humanizeValidationError(body);
        } else if (body != null && body.contains("\"detail\"")) {
            message = body.replaceAll(".*\"detail\"\\s*:\\s*\"([^\"]+)\".*", "$1");
        } else if (body != null && body.contains("\"message\"")) {
            message = body.replaceAll(".*\"message\"\\s*:\\s*\"([^\"]+)\".*", "$1");
        }

        HttpStatus status = ex.getStatusCode().is4xxClientError()
                ? HttpStatus.BAD_REQUEST
                : HttpStatus.BAD_GATEWAY;
        return new ResponseStatusException(status, message);
    }

    private ResponseStatusException unavailableException(Exception ex) {
        return new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Face service is not available right now. Please start the AI service and try again."
        );
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private MediaType resolveMediaType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }

        try {
            return MediaType.parseMediaType(contentType);
        } catch (Exception ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private String humanizeValidationError(String body) {
        Matcher msgMatcher = DETAIL_MSG_PATTERN.matcher(body);
        Matcher fieldMatcher = DETAIL_FIELD_PATTERN.matcher(body);
        List<String> messages = new ArrayList<>();

        while (msgMatcher.find() && fieldMatcher.find()) {
            String field = fieldMatcher.group(1);
            String label = switch (field) {
                case "image" -> "photo";
                case "name" -> "name";
                default -> field;
            };
            messages.add("Please provide a " + label + ".");
        }

        return messages.isEmpty() ? "Please provide the missing information." : String.join(" ", messages);
    }

    private static class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        private NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
