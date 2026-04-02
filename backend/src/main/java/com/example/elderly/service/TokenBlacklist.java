package com.example.elderly.service;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
@Service
public class TokenBlacklist {
    private final Set<String> blacklist = ConcurrentHashMap.newKeySet();
    public void add(String token)
    {
        blacklist.add(token);
    }

    public boolean isBlacklisted(String token) {
    return blacklist.contains(token);
}
}
