package com.example.elderly.service;

import com.example.elderly.model.Role;
import com.example.elderly.model.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.elderly.dto.AuthRequest;
import com.example.elderly.dto.AuthResponse;
import com.example.elderly.dto.RegisterRequest;
import com.example.elderly.repo.UserRepository;
import com.example.elderly.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor
public class AuthService {
    private final BCryptPasswordEncoder encoder;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;



    public String register(RegisterRequest request)
    {
   if(userRepository.findByEmail(request.getEmail()).isPresent())
   {
    throw new RuntimeException("User already exists");
   }
    

    User user=new User();
    user.setName(request.getName());
    user.setEmail(request.getEmail());
    user.setPassword(encoder.encode(request.getPassword()));
    user.setRole(Role.valueOf(request.getRole().toUpperCase()));
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setImageUrl(request.getImageUrl());



        userRepository.save(user);
        return "User registered sucessfully";
}

public AuthResponse login(AuthRequest request)
{
    User user=userRepository.findByEmail(request.getEmail()).orElseThrow(()->new RuntimeException("user not found"));

    if(!encoder.matches(request.getPassword(),user.getPassword())){
        throw new RuntimeException("Invalid Password");
    }
    String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token);

}



}
