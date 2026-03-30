package com.example.elderly.service;

import java.time.LocalDate;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.elderly.repo.MedicineTakenLogRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class MedicineScheduler {

    private final MedicineTakenLogRepository takenLogRepository;

    /**
     * Runs every day at midnight (00:00).
     * Deletes all taken logs older than today so each day starts fresh.
     * The next call to getTodayMedicines() will create new untaken logs
     * for that day automatically.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void resetDailyTakenStatus() {
        log.info("Running midnight medicine reset...");
        // Keep only today's logs — delete anything before today
        takenLogRepository.deleteByLogDateBefore(LocalDate.now());
        log.info("Medicine taken logs reset complete.");
    }
}