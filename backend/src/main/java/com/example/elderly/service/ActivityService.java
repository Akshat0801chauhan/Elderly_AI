package com.example.elderly.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.elderly.dto.ActivityProgressResponse;
import com.example.elderly.dto.ActivityRequest;
import com.example.elderly.dto.ActivityResponse;
import com.example.elderly.model.Activity;
import com.example.elderly.model.ActivityCompletionLog;
import com.example.elderly.model.Role;
import com.example.elderly.model.User;
import com.example.elderly.repo.ActivityCompletionLogRepository;
import com.example.elderly.repo.ActivityRepository;
import com.example.elderly.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityService {
    private final  ActivityRepository activityRepository;
    private final ActivityCompletionLogRepository activityCompletionLogRepository;

    private final UserRepository userRepository;
    private final CaregiverAccessService caregiverAccessService;
    private User getUserByEmail(String email){
          return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
    private User getLoggedInElder(String email){
        User user=getUserByEmail(email);
        if (user.getRole() != Role.ELDERLY) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only elderly users can access this resource");
        }
        return user;

    
    }
   @Transactional
    public Activity addActivity(String caregiverEmail, ActivityRequest request) {
        User elder = caregiverAccessService.validateAndGetElderly(caregiverEmail, request.getElderId());

        Activity activity = new Activity();
        activity.setTitle(request.getTitle().trim());
        activity.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        activity.setTime(parseTime(request.getTime()));
        activity.setMandatory(true);
        activity.setActive(true);
        activity.setElder(elder);

        return activityRepository.save(activity);
    }
    @Transactional(readOnly=true)
    public List<ActivityResponse> getTodayActivities(String email){
         User elder = getLoggedInElder(email);
        return buildActivityResponses(elder, LocalDate.now(), LocalTime.now(), false);
    }
    @Transactional
    public ActivityCompletionLog markComplete(String activityId, String email) {
        User elder = getLoggedInElder(email);

        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));

        if (!activity.getElder().getId().equals(elder.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This activity does not belong to you");
        }

        LocalDate today = LocalDate.now();

        ActivityCompletionLog log = activityCompletionLogRepository
                .findByActivityAndLogDate(activity, today)
                .orElseGet(() -> {
                    ActivityCompletionLog newLog = new ActivityCompletionLog();
                    newLog.setActivity(activity);
                    newLog.setLogDate(today);
                    return newLog;
                });

        log.setCompleted(true);
        log.setCompletedAt(LocalDateTime.now());

        return activityCompletionLogRepository.save(log);
    }
@Transactional
    public Activity updateActivity(String caregiverEmail, String activityId, ActivityRequest request) {
        User elder = caregiverAccessService.validateAndGetElderly(caregiverEmail, request.getElderId());

        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));

        if (!activity.getElder().getId().equals(elder.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This activity does not belong to the selected elder");
        }

        activity.setTitle(request.getTitle().trim());
        activity.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        activity.setTime(parseTime(request.getTime()));
        activity.setMandatory(true);

        return activityRepository.save(activity);
    }
    @Transactional
    public void deleteActivity(String caregiverEmail, String activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));

        caregiverAccessService.validateAndGetElderly(caregiverEmail, activity.getElder().getId());

        List<ActivityCompletionLog> logs = activityCompletionLogRepository
                .findByActivityInAndLogDateBetween(List.of(activity), LocalDate.of(2000, 1, 1), LocalDate.of(2999, 12, 31));
        activityCompletionLogRepository.deleteAll(logs);
        activityRepository.delete(activity);
    }
    @Transactional(readOnly = true)
    public ActivityProgressResponse getTodayProgress(String email) {
        User elder = getLoggedInElder(email);

        List<Activity> activities = activityRepository.findByElderAndActiveTrueOrderByTimeAsc(elder);
        LocalDate today = LocalDate.now();

        long completed = activities.stream()
                .filter(activity -> activityCompletionLogRepository.findByActivityAndLogDate(activity, today)
                        .map(ActivityCompletionLog::isCompleted)
                        .orElse(false))
                .count();

        return new ActivityProgressResponse(completed, activities.size());
    }
       @Transactional(readOnly = true)
    public Map<String, Object> getElderActivityView(String caregiverEmail, String elderId) {
        User elder = caregiverAccessService.validateAndGetElderly(caregiverEmail, elderId);

        List<ActivityResponse> todayActivities = buildActivityResponses(elder, LocalDate.now(), LocalTime.now(), true);
        ActivityProgressResponse progress = getProgressForElder(elder);

        long mandatoryCount = todayActivities.stream().filter(ActivityResponse::isMandatory).count();
        long mandatoryCompleted = todayActivities.stream()
                .filter(item -> item.isMandatory() && item.isCompleted())
                .count();

        Map<String, Object> response = new HashMap<>();
        response.put("elderId", elder.getId());
        response.put("elderName", elder.getName());
        response.put("progress", progress);
        response.put("consistency", mandatoryCount == 0 ? 100 : (mandatoryCompleted * 100 / mandatoryCount));
        response.put("activities", todayActivities);

        return response;
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getMissedActivities(String caregiverEmail, String elderId) {
        User elder = caregiverAccessService.validateAndGetElderly(caregiverEmail, elderId);

        return buildActivityResponses(elder, LocalDate.now(), LocalTime.now(), true)
                .stream()
                .filter(ActivityResponse::isMissed)
                .toList();
    }

    private ActivityProgressResponse getProgressForElder(User elder) {
        List<Activity> activities = activityRepository.findByElderAndActiveTrueOrderByTimeAsc(elder);
        LocalDate today = LocalDate.now();

        long completed = activities.stream()
                .filter(activity -> activityCompletionLogRepository.findByActivityAndLogDate(activity, today)
                        .map(ActivityCompletionLog::isCompleted)
                        .orElse(false))
                .count();

        return new ActivityProgressResponse(completed, activities.size());
    }

    private List<ActivityResponse> buildActivityResponses(User elder, LocalDate date, LocalTime now, boolean includeMissed) {
        List<Activity> activities = activityRepository.findByElderAndActiveTrueOrderByTimeAsc(elder);

        return activities.stream().map(activity -> {
            boolean completed = activityCompletionLogRepository.findByActivityAndLogDate(activity, date)
                    .map(ActivityCompletionLog::isCompleted)
                    .orElse(false);

            boolean missed = includeMissed && !completed && activity.getTime().isBefore(now);

            return new ActivityResponse(
                    activity.getId(),
                    activity.getTitle(),
                    activity.getDescription(),
                    activity.getTime(),
                    activity.isMandatory(),
                    completed,
                    missed
            );
        }).toList();
    }

    private LocalTime parseTime(String value) {
        try {
            return LocalTime.parse(value.trim());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time must be in HH:mm format");
        }
    }
}

    
