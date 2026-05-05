package com.example.elderly.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.from-number:}")
    private String fromNumber;

    public String sendSms(String toNumber, String message) {
        if (isBlank(toNumber)) {
            return "Skipped: caregiver phone number is missing";
        }
        if (isBlank(accountSid) || isBlank(authToken) || isBlank(fromNumber)) {
            return "Skipped: Twilio credentials are not configured";
        }

        String form = "To=" + encode(toNumber)
                + "&From=" + encode(fromNumber)
                + "&Body=" + encode(message);
        String auth = Base64.getEncoder()
                .encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return "Sent";
            }
            return "Failed: Twilio returned HTTP " + response.statusCode();
        } catch (IOException e) {
            return "Failed: " + e.getMessage();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Failed: interrupted while sending SMS";
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
