package com.example.elderly.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.elderly.model.Activity;
import com.example.elderly.model.ActivityCompletionLog;
import com.example.elderly.model.CaregiverAssignment;
import com.example.elderly.model.ChatHistory;
import com.example.elderly.model.Face;
import com.example.elderly.model.Medicine;
import com.example.elderly.model.Medicine.MealTiming;
import com.example.elderly.model.MedicineTakenLog;
import com.example.elderly.model.Role;
import com.example.elderly.model.User;
import com.example.elderly.repo.ActivityCompletionLogRepository;
import com.example.elderly.repo.ActivityRepository;
import com.example.elderly.repo.CaregiverAssignmentRepository;
import com.example.elderly.repo.ChatHistoryRepository;
import com.example.elderly.repo.FaceRepository;
import com.example.elderly.repo.MedicineTakenLogRepository;
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
    private final MedicineTakenLogRepository takenLogRepository;
    private final ActivityRepository activityRepository;
    private final ActivityCompletionLogRepository activityCompletionLogRepository;
    private final FaceRepository faceRepository;
    private final CaregiverAssignmentRepository caregiverAssignmentRepository;
    private final ChatHistoryRepository chatHistoryRepository;
    private final CaregiverAccessService caregiverAccessService;

    @Value("${groq.api.key}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "openai/gpt-oss-20b";
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public String chat(String email, String userMessage, boolean voice, String elderId) throws Exception {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ChatHistory> recentChats = chatHistoryRepository.findTop10ByUserOrderByTimestampDesc(user);

        String systemPrompt = """
                You are a caring AI decision engine for elderly care, not a generic chatbot.
                Use the provided database context first: medicine logs, activity logs, current time,
                missed tasks, known visitors/faces, health profile, and caregiver status.
                If the logged-in user is a caregiver, answer as a caregiver assistant about the selected patient.
                Mention the patient's name and overall status when useful: medicines, activities, missed items,
                due items, health notes, known people, and what action the caregiver should take.
                Give personalized answers with exact counts when the user asks about progress.
                If a medicine is missed, gently remind and encourage.
                If caregiver attention is needed, clearly explain the situation.
                Never invent database facts. If the data does not say something, say you do not see it.
                Keep responses concise: 2 to 4 sentences unless asked for more.
                If the user is speaking via voice, keep response extra short and clear.

                """
                + buildDailyContext(user, LocalDate.now(), LocalTime.now(), elderId) + "\n"
                + buildChatContext(recentChats);

        String aiResponse = callGroq(systemPrompt, userMessage);

        ChatHistory history = new ChatHistory();
        history.setUser(user);
        history.setMessage(userMessage);
        history.setResponse(aiResponse);
        history.setTimestamp(LocalDateTime.now());
        history.setVoice(voice);
        chatHistoryRepository.save(history);

        return aiResponse;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProactiveMessages(String email, String elderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        DailySnapshot snapshot = getDailySnapshot(user, LocalDate.now(), LocalTime.now(), elderId);
        List<String> userMessages = new ArrayList<>();
        List<String> caregiverAlerts = new ArrayList<>();

        snapshot.dueMedicines().forEach(med ->
                userMessages.add("It is time for your " + med.getName() + " medicine."));
        snapshot.missedMedicines().forEach(med ->
                userMessages.add("You missed " + med.getName() + " scheduled at " + formatTime(med.getTime()) + "."));
        snapshot.missedActivities().forEach(activity ->
                userMessages.add("You have not completed " + activity.getTitle() + " today."));

        if (snapshot.missedMedicines().size() >= 2) {
            caregiverAlerts.add(snapshot.elder().getName() + " missed " + snapshot.missedMedicines().size()
                    + " medicines today: " + medicineNames(snapshot.missedMedicines()) + ".");
        }
        if (!snapshot.missedActivities().isEmpty()) {
            caregiverAlerts.add(snapshot.elder().getName() + " missed activities today: "
                    + activityNames(snapshot.missedActivities()) + ".");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("messages", userMessages);
        response.put("caregiverAlerts", caregiverAlerts);
        response.put("dailySummary", buildDailySummary(snapshot));
        response.put("elder", Map.of(
                "id", snapshot.elder().getId(),
                "name", snapshot.elder().getName(),
                "email", snapshot.elder().getEmail()));
        caregiverAssignmentRepository.findByElderlyId(snapshot.elder().getId())
                .map(CaregiverAssignment::getCaregiver)
                .ifPresent(caregiver -> response.put("caregiver", Map.of(
                        "name", caregiver.getName(),
                        "email", caregiver.getEmail(),
                        "phone", caregiver.getPhone() == null ? "" : caregiver.getPhone())));
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDailySummary(String email, String elderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        DailySnapshot snapshot = getDailySnapshot(user, LocalDate.now(), LocalTime.now(), elderId);
        return Map.of(
                "elderId", snapshot.elder().getId(),
                "elderName", snapshot.elder().getName(),
                "summary", buildDailySummary(snapshot));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCaregiverInsight(String caregiverEmail, String elderId) {
        User elder = caregiverAccessService.validateAndGetElderly(caregiverEmail, elderId);
        DailySnapshot snapshot = getDailySnapshot(elder, LocalDate.now(), LocalTime.now(), elder.getId());

        List<String> risks = new ArrayList<>();
        if (!snapshot.missedMedicines().isEmpty()) {
            risks.add("Missed medicines: " + medicineNames(snapshot.missedMedicines()));
        }
        if (!snapshot.missedActivities().isEmpty()) {
            risks.add("Missed activities: " + activityNames(snapshot.missedActivities()));
        }
        if (risks.isEmpty()) {
            risks.add("No missed medicines or activities so far today.");
        }

        return Map.of(
                "elderId", elder.getId(),
                "elderName", elder.getName(),
                "summary", buildDailySummary(snapshot),
                "risks", risks,
                "recommendedAction", snapshot.missedMedicines().size() >= 2
                        ? "Please check in with " + elder.getName() + " about today's medicines."
                        : "Routine monitoring is enough right now.");
    }

    private String buildDailyContext(User user, LocalDate date, LocalTime now, String elderId) {
        DailySnapshot snapshot = getDailySnapshot(user, date, now, elderId);
        StringBuilder context = new StringBuilder();

        context.append("Conversation Mode:\n");
        context.append("- Logged-in role: ").append(user.getRole()).append("\n");
        context.append("- Answering about patient: ").append(valueOrUnknown(snapshot.elder().getName())).append("\n\n");

        context.append("Patient Profile:\n");
        context.append("- Name: ").append(valueOrUnknown(snapshot.elder().getName())).append("\n");
        context.append("- Current date: ").append(date).append("\n");
        context.append("- Current time: ").append(formatTime(now)).append("\n");
        context.append("- Allergies: ").append(valueOrNone(snapshot.elder().getAllergies())).append("\n");
        context.append("- Chronic diseases: ").append(valueOrNone(snapshot.elder().getChronicDiseases())).append("\n\n");

        context.append("Medicine Progress:\n");
        context.append("- Taken: ").append(snapshot.takenMedicines().size()).append("/")
                .append(snapshot.todayMedicines().size()).append("\n");
        context.append("- Missed so far: ").append(snapshot.missedMedicines().size()).append("\n");
        context.append("- Due now: ").append(snapshot.dueMedicines().size()).append("\n");
        if (snapshot.todayMedicines().isEmpty()) {
            context.append("- No medicines scheduled today.\n");
        } else {
            for (Medicine med : snapshot.todayMedicines()) {
                boolean taken = snapshot.takenMedicines().contains(med);
                boolean missed = snapshot.missedMedicines().contains(med);
                boolean due = snapshot.dueMedicines().contains(med);
                context.append(String.format("- %s | %s | %s | %s | %s\n",
                        med.getName(),
                        valueOrUnknown(med.getDosage()),
                        formatTime(med.getTime()),
                        taken ? "taken" : missed ? "missed" : due ? "due now" : "pending",
                        mealInstructions(med)));
                context.append(String.format("  Course: %s to %s, %d day(s) remaining\n",
                        med.getStartDate(),
                        med.getStartDate().plusDays(med.getNumberOfDays() - 1L),
                        Math.max(0, ChronoUnit.DAYS.between(date,
                                med.getStartDate().plusDays(med.getNumberOfDays())))));
                if (med.getNotes() != null && !med.getNotes().isBlank()) {
                    context.append("  Note: ").append(med.getNotes()).append("\n");
                }
            }
        }

        context.append("\nActivity Progress:\n");
        context.append("- Completed: ").append(snapshot.completedActivities().size()).append("/")
                .append(snapshot.todayActivities().size()).append("\n");
        context.append("- Missed so far: ").append(snapshot.missedActivities().size()).append("\n");
        if (snapshot.todayActivities().isEmpty()) {
            context.append("- No activities scheduled today.\n");
        } else {
            for (Activity activity : snapshot.todayActivities()) {
                boolean completed = snapshot.completedActivities().contains(activity);
                boolean missed = snapshot.missedActivities().contains(activity);
                context.append(String.format("- %s | %s | %s\n",
                        activity.getTitle(),
                        formatTime(activity.getTime()),
                        completed ? "completed" : missed ? "missed" : "pending"));
            }
        }

        context.append("\nKnown People / Memory:\n");
        if (snapshot.knownFaces().isEmpty()) {
            context.append("- No known visitors/faces saved.\n");
        } else {
            snapshot.knownFaces().forEach(face -> context.append("- ")
                    .append(face.getName())
                    .append(face.getRelation() == null || face.getRelation().isBlank()
                            ? ""
                            : " (" + face.getRelation() + ")")
                    .append("\n"));
        }

        caregiverAssignmentRepository.findByElderlyId(snapshot.elder().getId())
                .map(CaregiverAssignment::getCaregiver)
                .ifPresent(caregiver -> context.append("\nCaregiver:\n- ")
                        .append(caregiver.getName()).append(" | ")
                        .append(caregiver.getEmail()).append("\n"));

        return context.toString();
    }

    private String buildChatContext(List<ChatHistory> recentChats) {
        StringBuilder chatContext = new StringBuilder("Recent Conversation:\n");
        if (recentChats.isEmpty()) {
            chatContext.append("- No previous conversations.\n");
            return chatContext.toString();
        }

        for (int i = recentChats.size() - 1; i >= 0; i--) {
            ChatHistory ch = recentChats.get(i);
            String source = ch.isVoice() ? "[voice]" : "[text]";
            chatContext.append("User ").append(source).append(": ").append(ch.getMessage()).append("\n");
            chatContext.append("Assistant: ").append(ch.getResponse()).append("\n");
        }
        return chatContext.toString();
    }

    private DailySnapshot getDailySnapshot(User user, LocalDate date, LocalTime now, String elderId) {
        User elder = resolveElderForContext(user, elderId);
        List<Medicine> todayMeds = medicineRepository.findActiveOnDate(elder.getId(), date);
        List<Medicine> taken = new ArrayList<>();
        List<Medicine> missed = new ArrayList<>();
        List<Medicine> due = new ArrayList<>();

        for (Medicine med : todayMeds) {
            boolean isTaken = takenLogRepository.findByMedicineAndLogDate(med, date)
                    .map(MedicineTakenLog::isTaken)
                    .orElse(false);
            if (isTaken) {
                taken.add(med);
            } else if (med.getTime().isBefore(now)) {
                missed.add(med);
            } else if (!med.getTime().isAfter(now.plusMinutes(30))) {
                due.add(med);
            }
        }

        List<Activity> activities = activityRepository.findByElderAndActiveTrueOrderByTimeAsc(elder);
        List<Activity> completed = new ArrayList<>();
        List<Activity> missedActivities = new ArrayList<>();

        for (Activity activity : activities) {
            boolean isCompleted = activityCompletionLogRepository.findByActivityAndLogDate(activity, date)
                    .map(ActivityCompletionLog::isCompleted)
                    .orElse(false);
            if (isCompleted) {
                completed.add(activity);
            } else if (activity.getTime().isBefore(now)) {
                missedActivities.add(activity);
            }
        }

        List<Face> faces = faceRepository.findAllByUser(elder);
        return new DailySnapshot(elder, todayMeds, taken, missed, due, activities, completed, missedActivities, faces);
    }

    private User resolveElderForContext(User user, String elderId) {
        if (user.getRole() != Role.CAREGIVER) {
            return user;
        }

        if (elderId != null && !elderId.isBlank()) {
            return caregiverAccessService.validateAndGetElderly(user.getEmail(), elderId);
        }

        return caregiverAssignmentRepository.findByCaregiverId(user.getId())
                .stream()
                .findFirst()
                .map(CaregiverAssignment::getElderly)
                .orElse(user);
    }

    private String buildDailySummary(DailySnapshot snapshot) {
        String missed = "";
        if (!snapshot.missedMedicines().isEmpty()) {
            missed += " medicines: " + medicineNames(snapshot.missedMedicines());
        }
        if (!snapshot.missedActivities().isEmpty()) {
            missed += (missed.isBlank() ? "" : ";") + " activities: " + activityNames(snapshot.missedActivities());
        }

        return "Today you completed " + snapshot.takenMedicines().size() + "/"
                + snapshot.todayMedicines().size() + " medicines and "
                + snapshot.completedActivities().size() + "/" + snapshot.todayActivities().size()
                + " activities. " + (missed.isBlank()
                        ? "No missed tasks are showing right now."
                        : "Missed:" + missed + ".");
    }

    private String mealInstructions(Medicine med) {
        List<String> parts = new ArrayList<>();
        if (med.getBreakfastTiming() != MealTiming.NONE) {
            parts.add("breakfast " + med.getBreakfastTiming().name().toLowerCase());
        }
        if (med.getLunchTiming() != MealTiming.NONE) {
            parts.add("lunch " + med.getLunchTiming().name().toLowerCase());
        }
        if (med.getDinnerTiming() != MealTiming.NONE) {
            parts.add("dinner " + med.getDinnerTiming().name().toLowerCase());
        }
        return parts.isEmpty() ? "no meal instruction" : String.join(", ", parts);
    }

    private String medicineNames(List<Medicine> medicines) {
        return medicines.isEmpty()
                ? "none"
                : String.join(", ", medicines.stream().map(Medicine::getName).toList());
    }

    private String activityNames(List<Activity> activities) {
        return activities.isEmpty()
                ? "none"
                : String.join(", ", activities.stream().map(Activity::getTitle).toList());
    }

    private String formatTime(LocalTime time) {
        return time == null ? "unknown time" : time.format(TIME_FORMATTER);
    }

    private String valueOrUnknown(String value) {
        return value == null || value.isBlank() ? "unknown" : value;
    }

    private String valueOrNone(String value) {
        return value == null || value.isBlank() ? "none recorded" : value;
    }

    private String callGroq(String systemPrompt, String userMessage) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", MODEL);
        body.put("max_tokens", 300);
        body.put("temperature", 0.4);

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

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        JsonNode json = objectMapper.readTree(response.body());
        if (json.has("error")) {
            throw new RuntimeException("Groq API Error: " + json.get("error").get("message").asText());
        }

        JsonNode choices = json.get("choices");
        if (choices != null && choices.isArray() && !choices.isEmpty()) {
            return choices.get(0).get("message").get("content").asText().trim();
        }

        throw new RuntimeException("Unexpected response from Groq.");
    }

    private record DailySnapshot(
            User elder,
            List<Medicine> todayMedicines,
            List<Medicine> takenMedicines,
            List<Medicine> missedMedicines,
            List<Medicine> dueMedicines,
            List<Activity> todayActivities,
            List<Activity> completedActivities,
            List<Activity> missedActivities,
            List<Face> knownFaces
    ) {}
}
