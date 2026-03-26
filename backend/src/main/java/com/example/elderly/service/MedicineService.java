package com.example.elderly.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

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

    public String addMedicine(String email, AddMedicineRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Medicine medicine = new Medicine();
        medicine.setName(request.getName());
        medicine.setDosage(request.getDosage());
        medicine.setTime(LocalTime.parse(request.getTime()));
        medicine.setTaken(false);
        medicine.setDate(LocalDate.now());
        medicine.setUser(user);

        medicineRepository.save(medicine);

        return "Medicine added";
    }

    public List<Medicine> getTodayMedicines(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return medicineRepository.findByUserAndDate(user, LocalDate.now());
    }

    public String markAsTaken(String medicineId) {

        Medicine med = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        med.setTaken(true);
        medicineRepository.save(med);

        return "Marked as taken";
    }

    public int getProgress(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Medicine> meds = medicineRepository.findByUserAndDate(user, LocalDate.now());

        long taken = meds.stream().filter(Medicine::isTaken).count();

        return (int) taken;
    }
}