package com.example.elderly.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.elderly.model.Activity;
import com.example.elderly.model.User;



public interface ActivityRepository extends JpaRepository<Activity,String>{
    List<Activity> findByElderAndActiveTrueOrderByTimeAsc(User elder);
}
