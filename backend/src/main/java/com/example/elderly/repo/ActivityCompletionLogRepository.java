package com.example.elderly.repo;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.elderly.model.Activity;
import com.example.elderly.model.ActivityCompletionLog;

public interface ActivityCompletionLogRepository extends JpaRepository<ActivityCompletionLog, String> {
    Optional<ActivityCompletionLog> findByActivityAndLogDate(Activity activity, LocalDate logDate);
    List<ActivityCompletionLog> findByActivityInAndLogDate(List<Activity> activities, LocalDate logDate);
    List<ActivityCompletionLog> findByActivityInAndLogDateBetween(List<Activity> activities, LocalDate startDate, LocalDate endDate);
}
