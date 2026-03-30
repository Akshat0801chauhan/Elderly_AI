package com.example.elderly.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.elderly.model.ChatHistory;
import com.example.elderly.model.Medicine;
import com.example.elderly.model.Medicine.MealTiming;
import com.example.elderly.model.User;
import com.example.elderly.repo.ChatHistoryRepository;
import com.example.elderly.repo.Medicinerepository;
import com.example.elderly.repo.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final UserRepository userRepository;
    private final Medicinerepository medicineRepository;
    private final ChatHistoryRepository chatHistoryRepository;

    @Value("${groq.api.key}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "openai/gpt-oss-20b";

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String chat(String email, String userMessage, boolean voice) throws Exception {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Use findActiveOnDate so multi-day medicines are included
        List<Medicine> todayMeds = medicineRepository
                .findActiveOnDate(user.getId(), LocalDate.now());

        List<ChatHistory> recentChats = chatHistoryRepository
                .findTop10ByUserOrderByTimestampDesc(user);

        // ── Build rich medicine context with all new fields ──
        StringBuilder medContext = new StringBuilder("Today's Medicines:\n");

        if (todayMeds.isEmpty()) {
            medContext.append("- No medicines scheduled today.\n");
        } else {
            for (Medicine med : todayMeds) {

                medContext.append(String.format(
                    "- %s | Dosage: %s | Time: %s | Status: %s\n",
                    med.getName(),
                    med.getDosage(),
                    med.getTime(),
                    med.isTaken() ? "Taken ✅" : "Not taken ❌"
                ));

                // Meal timing info
                if (med.getBreakfastTiming() != MealTiming.NONE) {
                    medContext.append(String.format(
                        "  → Breakfast: %s meal\n", med.getBreakfastTiming().toString().toLowerCase()
                    ));
                }
                if (med.getLunchTiming() != MealTiming.NONE) {
                    medContext.append(String.format(
                        "  → Lunch: %s meal\n", med.getLunchTiming().toString().toLowerCase()
                    ));
                }
                if (med.getDinnerTiming() != MealTiming.NONE) {
                    medContext.append(String.format(
                        "  → Dinner: %s meal\n", med.getDinnerTiming().toString().toLowerCase()
                    ));
                }

                // Course duration
                medContext.append(String.format(
                    "  → Course: %d days (started %s, ends %s)\n",
                    med.getNumberOfDays(),
                    med.getStartDate(),
                    med.getStartDate().plusDays(med.getNumberOfDays() - 1)
                ));

                // Days remaining
                long daysLeft = LocalDate.now().until(
                    med.getStartDate().plusDays(med.getNumberOfDays()), java.time.temporal.ChronoUnit.DAYS
                );
                if (daysLeft > 0) {
                    medContext.append(String.format("  → %d day(s) remaining in course\n", daysLeft));
                } else {
                    medContext.append("  → Course completed\n");
                }

                // Notes
                if (med.getNotes() != null && !med.getNotes().isBlank()) {
                    medContext.append(String.format("  → Note: %s\n", med.getNotes()));
                }
            }
        }

        // ── Build chat history context ──
        StringBuilder chatContext = new StringBuilder("Recent Conversation:\n");
        if (recentChats.isEmpty()) {
            chatContext.append("- No previous conversations.\n");
        } else {
            for (int i = recentChats.size() - 1; i >= 0; i--) {
                ChatHistory ch = recentChats.get(i);
                String source = ch.isVoice() ? "[voice]" : "[text]";
                chatContext.append("User ").append(source).append(": ").append(ch.getMessage()).append("\n");
                chatContext.append("Assistant: ").append(ch.getResponse()).append("\n");
            }
        }

        // ── System prompt ──
        String systemPrompt = """
                You are a caring, friendly AI health assistant for elderly users.
                You know the user's full medicine schedule including:
                - medicine names, dosages, and times
                - whether each medicine should be taken before or after meals
                - how many days the course lasts and how many days are remaining
                - any special notes about the medicine
                - whether each medicine has been taken today

                Always respond in a warm, simple, easy-to-understand tone.
                Give specific advice based on the data provided.
                If a medicine is missed, gently remind and encourage.
                If a course is ending soon, mention it.
                If medicine has meal instructions (before/after food), remind the user.
                Keep responses concise — 2 to 4 sentences unless asked for more.
                Never make up medicine data — only use what is given to you.
                If the user is speaking via voice, keep response extra short and clear.

                """
                + medContext + "\n"
                + chatContext;

        String aiResponse = callGroq(systemPrompt, userMessage);

        // ── Save to DB with voice flag ──
        ChatHistory history = new ChatHistory();
        history.setUser(user);
        history.setMessage(userMessage);
        history.setResponse(aiResponse);
        history.setTimestamp(LocalDateTime.now());
        history.setVoice(voice);
        chatHistoryRepository.save(history);

        return aiResponse;
    }

    private String callGroq(String systemPrompt, String userMessage) throws Exception {

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", MODEL);
        body.put("max_tokens", 300);
        body.put("temperature", 0.7);

        ArrayNode messages = objectMapper.createArrayNode();

        ObjectNode systemMsg = objectMapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);

        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);

        body.set("messages", messages);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
        System.out.println("API KEY: " + groqApiKey);
        // Replace the bottom part of callGroq with this:
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println("Groq Response Status: " + response.statusCode());
System.out.println("Groq Response Body: " + response.body()); // This is the gold mine for debugging!

JsonNode json = objectMapper.readTree(response.body());

if (json.has("error")) {
    String errorMsg = json.get("error").get("message").asText();
    throw new RuntimeException("Groq API Error: " + errorMsg);
}

JsonNode choices = json.get("choices");
if (choices != null && choices.isArray() && !choices.isEmpty()) {
    return choices.get(0).get("message").get("content").asText().trim();
} else {
    throw new RuntimeException("Unexpected response from Groq. Check console logs for body.");
}
    }
}