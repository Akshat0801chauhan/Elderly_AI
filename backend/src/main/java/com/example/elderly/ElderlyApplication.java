package com.example.elderly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ElderlyApplication {

    public static void main(String[] args) {
        SpringApplication.run(ElderlyApplication.class, args);
    }
}