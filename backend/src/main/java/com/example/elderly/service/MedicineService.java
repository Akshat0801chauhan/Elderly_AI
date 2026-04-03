package com.example.elderly.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.example.elderly.dto.AddMedicineRequest;
import com.example.elderly.model.Medicine;
import com.example.elderly.model.Medicine.MealTiming;
import com.example.elderly.model.MedicineTakenLog;
import com.example.elderly.model.User;
import com.example.elderly.repo.MedicineTakenLogRepository;
import com.example.elderly.repo.Medicinerepository;
import com.example.elderly.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final Medicinerepository         medicineRepository;
    private final UserRepository             userRepository;
    private final MedicineTakenLogRepository takenLogRepository;

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── ADD ──────────────────────────────────────────────

    public List<Medicine> addMedicine(String email, AddMedicineRequest request) {
        User user = getUser(email);
        LocalDate startDate = request.getStartDate() != null ? LocalDate.parse(request.getStartDate()) : LocalDate.now();
        List<ScheduleSelection> selections = getSelectedSchedules(request);

        return selections.stream().map(selection -> {
            Medicine medicine = new Medicine();
            medicine.setUser(user);
            medicine.setName(request.getName().trim());
            medicine.setDosage(request.getDosage().trim());
            medicine.setTime(selection.time());
            medicine.setDate(LocalDate.now());
            medicine.setBreakfastTiming(selection.meal().equals("breakfast") ? selection.timing() : MealTiming.NONE);
            medicine.setLunchTiming(selection.meal().equals("lunch") ? selection.timing() : MealTiming.NONE);
            medicine.setDinnerTiming(selection.meal().equals("dinner") ? selection.timing() : MealTiming.NONE);
            medicine.setNumberOfDays(request.getNumberOfDays() != null ? request.getNumberOfDays() : 1);
            medicine.setStartDate(startDate);
            medicine.setNotes(request.getNotes());
            return medicineRepository.save(medicine);
        }).toList();
    }

    // ── GET TODAY (with per-day taken log) ───────────────

    @Transactional
    public List<MedicineTakenLog> getTodayMedicines(String email) {
        User user = getUser(email);
        LocalDate today = LocalDate.now();
        List<Medicine> active = medicineRepository.findActiveOnDate(user.getId(), today);
        return active.stream().map(med ->
            takenLogRepository.findByMedicineAndLogDate(med, today)
                .orElseGet(() -> {
                    MedicineTakenLog log = new MedicineTakenLog();
                    log.setMedicine(med);
                    log.setLogDate(today);
                    log.setTaken(false);
                    return takenLogRepository.save(log);
                })
        ).collect(Collectors.toList());
    }

    // ── GET ALL (medicine management page) ───────────────

    public List<Medicine> getAllMedicines(String email) {
        User user = getUser(email);
        return medicineRepository.findByUser(user);
    }

    // ── MARK TAKEN ───────────────────────────────────────

    @Transactional
    public MedicineTakenLog markAsTaken(String medicineId, String email) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        if (!medicine.getUser().getEmail().equals(email)) throw new RuntimeException("Unauthorized");

        LocalDate today = LocalDate.now();
        MedicineTakenLog log = takenLogRepository.findByMedicineAndLogDate(medicine, today)
                .orElseGet(() -> {
                    MedicineTakenLog newLog = new MedicineTakenLog();
                    newLog.setMedicine(medicine);
                    newLog.setLogDate(today);
                    return newLog;
                });
        log.setTaken(true);
        return takenLogRepository.save(log);
    }

    // ── PROGRESS ─────────────────────────────────────────

    public long getProgress(String email) {
        User user = getUser(email);
        List<Medicine> active = medicineRepository.findActiveOnDate(user.getId(), LocalDate.now());
        return active.stream()
                .filter(med -> takenLogRepository.findByMedicineAndLogDate(med, LocalDate.now())
                        .map(MedicineTakenLog::isTaken).orElse(false))
                .count();
    }

    // ── UPDATE ────────────────────────────────────────────

    public Medicine updateMedicine(String id, AddMedicineRequest request, String email) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found"));
        if (!medicine.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot update this medicine");
        }
        List<ScheduleSelection> selections = getSelectedSchedules(request);
        if (selections.size() != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Edit one medicine slot at a time");
        }

        ScheduleSelection selection = selections.getFirst();

        medicine.setName(request.getName().trim());
        medicine.setDosage(request.getDosage().trim());
        medicine.setTime(selection.time());
        medicine.setBreakfastTiming(selection.meal().equals("breakfast") ? selection.timing() : MealTiming.NONE);
        medicine.setLunchTiming(selection.meal().equals("lunch") ? selection.timing() : MealTiming.NONE);
        medicine.setDinnerTiming(selection.meal().equals("dinner") ? selection.timing() : MealTiming.NONE);
        medicine.setNumberOfDays(request.getNumberOfDays() != null ? request.getNumberOfDays() : 1);
        medicine.setStartDate(
            request.getStartDate() != null ? LocalDate.parse(request.getStartDate()) : medicine.getStartDate()
        );
        medicine.setNotes(request.getNotes());
        return medicineRepository.save(medicine);
    }

    // ── DELETE ────────────────────────────────────────────

    @Transactional
    public void deleteMedicine(String id, String email) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        if (!medicine.getUser().getEmail().equals(email)) throw new RuntimeException("Unauthorized");
        // delete all taken logs for this medicine first
        takenLogRepository.findAllByMedicine(medicine).forEach(takenLogRepository::delete);
        medicineRepository.delete(medicine);
    }

    private MealTiming orNone(MealTiming value) {
        return value != null ? value : MealTiming.NONE;
    }

    private List<ScheduleSelection> getSelectedSchedules(AddMedicineRequest request) {
        List<ScheduleSelection> selections = new ArrayList<>();
        addSelection(selections, "breakfast", request.getBreakfastTiming(), request.getBreakfastTime());
        addSelection(selections, "lunch", request.getLunchTiming(), request.getLunchTime());
        addSelection(selections, "dinner", request.getDinnerTiming(), request.getDinnerTime());

        if (selections.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one meal slot");
        }

        return selections;
    }

    private void addSelection(List<ScheduleSelection> selections, String meal, MealTiming timing, String timeValue) {
        MealTiming normalized = orNone(timing);
        if (normalized == MealTiming.NONE) {
            return;
        }

        if (timeValue == null || timeValue.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a time for " + meal);
        }

        try {
            selections.add(new ScheduleSelection(meal, normalized, LocalTime.parse(timeValue.trim())));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time for " + meal + " must be in HH:mm format");
        }
    }

    private record ScheduleSelection(String meal, MealTiming timing, LocalTime time) {}
}
