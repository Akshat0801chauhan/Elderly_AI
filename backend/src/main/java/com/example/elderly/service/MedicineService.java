package com.example.elderly.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.elderly.dto.AddMedicineRequest;
import com.example.elderly.model.Medicine;
import com.example.elderly.model.User;
import com.example.elderly.repo.Medicinerepository;
import com.example.elderly.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final Medicinerepository medicineRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm");

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Map<String, String> addMedicine(String email, AddMedicineRequest request) {

        User user = getUser(email);

        if (request.getTime() == null || request.getTime().isEmpty()) {
            throw new RuntimeException("Time is required (HH:mm)");
        }

        LocalTime time;
        try {
            time = LocalTime.parse(request.getTime(), TIME_FORMAT);
        } catch (Exception e) {
            throw new RuntimeException("Invalid time format. Use HH:mm (e.g. 14:30)");
        }

        Medicine medicine = new Medicine();
        medicine.setName(request.getName());
        medicine.setDosage(request.getDosage());
        medicine.setTime(time);
        medicine.setTaken(false);
        medicine.setDate(LocalDate.now());
        medicine.setUser(user);

        medicineRepository.save(medicine);

        return Map.of("message", "Medicine added");
    }

    public List<Medicine> getTodayMedicines(String email) {
        User user = getUser(email);

        
        return medicineRepository.findByUserAndDateOrderByTimeAsc(user, LocalDate.now());
    }

    
    public Map<String, String> markAsTaken(String medicineId, String email) {

        User user = getUser(email);

        Medicine med = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        
        if (!med.getUser().getEmail().equals(user.getEmail())) {
            throw new RuntimeException("Unauthorized");
        }

        med.setTaken(true);
        medicineRepository.save(med);

        return Map.of("message", "Marked as taken");
    }

    public Map<String, Integer> getProgress(String email) {

        User user = getUser(email);

        
        List<Medicine> meds =
                medicineRepository.findByUserAndDateOrderByTimeAsc(user, LocalDate.now());

        long taken = meds.stream().filter(Medicine::isTaken).count();

        return Map.of(
                "taken", (int) taken,
                "total", meds.size()
        );
    }

    public Map<String, String> updateMedicine(String id, AddMedicineRequest request) {

        Medicine med = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        if (request.getTime() == null || request.getTime().isEmpty()) {
            throw new RuntimeException("Time is required (HH:mm)");
        }

        LocalTime time;
        try {
            time = LocalTime.parse(request.getTime(), TIME_FORMAT);
        } catch (Exception e) {
            throw new RuntimeException("Invalid time format. Use HH:mm");
        }

        med.setName(request.getName());
        med.setDosage(request.getDosage());
        med.setTime(time);

        medicineRepository.save(med);

        return Map.of("message", "Medicine updated");
    }
}