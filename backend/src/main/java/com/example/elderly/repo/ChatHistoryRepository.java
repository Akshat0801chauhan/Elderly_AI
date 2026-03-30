package com.example.elderly.repo;

import com.example.elderly.model.ChatHistory;
import com.example.elderly.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, String> {

    
    List<ChatHistory> findTop10ByUserOrderByTimestampDesc(User user);
}