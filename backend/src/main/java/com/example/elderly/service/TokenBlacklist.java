package com.example.elderly.service;

import java.util.HashSet;
import java.util.Set;

import org.springframework.stereotype.Service;
@Service
public class TokenBlacklist {
    private final Set<String> blacklist=new HashSet<>();
    public void add(String token)
    {
        blacklist.add(token);
    }

    public boolean isBlacklisted(String token) {
    return blacklist.contains(token);
}
}
