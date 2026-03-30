package com.example.elderly.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.elderly.dto.AddMedicineRequest;
import com.example.elderly.model.Medicine;
import com.example.elderly.model.Medicine.MealTiming;
import com.example.elderly.model.User;
import com.example.elderly.repo.Medicinerepository;
import com.example.elderly.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final Medicinerepository medicineRepository;
    private final UserRepository userRepository;

    // ── HELPER ───────────────────────────────────────────

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── ADD ──────────────────────────────────────────────

    public Medicine addMedicine(String email, AddMedicineRequest request) {
        User user = getUser(email);

        Medicine medicine = new Medicine();
        medicine.setUser(user);
        medicine.setName(request.getName());
        medicine.setDosage(request.getDosage());
        medicine.setTime(LocalTime.parse(request.getTime()));
        medicine.setDate(LocalDate.now()); // existing behaviour

        // new fields
        medicine.setBreakfastTiming(orNone(request.getBreakfastTiming()));
        medicine.setLunchTiming(orNone(request.getLunchTiming()));
        medicine.setDinnerTiming(orNone(request.getDinnerTiming()));
        medicine.setNumberOfDays(request.getNumberOfDays() != null ? request.getNumberOfDays() : 1);
        medicine.setStartDate(
            request.getStartDate() != null
                ? LocalDate.parse(request.getStartDate())
                : LocalDate.now()
        );
        medicine.setNotes(request.getNotes());

        return medicineRepository.save(medicine);
    }

    // ── GET TODAY ────────────────────────────────────────

    public List<Medicine> getTodayMedicines(String email) {
        User user = getUser(email);
        // Pass user.getId() — native query takes userId (String) not User object
        return medicineRepository.findActiveOnDate(user.getId(), LocalDate.now());
    }

    // ── MARK TAKEN ───────────────────────────────────────

    public Medicine markAsTaken(String id, String email) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        if (!medicine.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }

        medicine.setTaken(true);
        return medicineRepository.save(medicine);
    }

    // ── PROGRESS ─────────────────────────────────────────

    public long getProgress(String email) {
        User user = getUser(email);
        List<Medicine> todays = medicineRepository.findActiveOnDate(user.getId(), LocalDate.now());
        return todays.stream().filter(Medicine::isTaken).count();
    }

    // ── UPDATE ───────────────────────────────────────────

    public Medicine updateMedicine(String id, AddMedicineRequest request) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        medicine.setName(request.getName());
        medicine.setDosage(request.getDosage());
        medicine.setTime(LocalTime.parse(request.getTime()));

        // new fields
        medicine.setBreakfastTiming(orNone(request.getBreakfastTiming()));
        medicine.setLunchTiming(orNone(request.getLunchTiming()));
        medicine.setDinnerTiming(orNone(request.getDinnerTiming()));
        medicine.setNumberOfDays(request.getNumberOfDays() != null ? request.getNumberOfDays() : 1);
        medicine.setStartDate(
            request.getStartDate() != null
                ? LocalDate.parse(request.getStartDate())
                : medicine.getStartDate()
        );
        medicine.setNotes(request.getNotes());

        return medicineRepository.save(medicine);
    }

    // ── UTIL ─────────────────────────────────────────────

    private MealTiming orNone(MealTiming value) {
        return value != null ? value : MealTiming.NONE;
    }
}