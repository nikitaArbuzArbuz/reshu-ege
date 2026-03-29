package com.egeprep.service;

import com.egeprep.dto.AuthDtos;
import com.egeprep.model.Role;
import com.egeprep.model.User;
import com.egeprep.repo.UserRepository;
import com.egeprep.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthDtos.AuthResult register(AuthDtos.RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email уже зарегистрирован");
        }
        User u = new User();
        u.setEmail(req.email().trim().toLowerCase());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setDisplayName(req.displayName().trim());
        u.setRole(Role.STUDENT);
        userRepository.save(u);
        return toResult(u);
    }

    public AuthDtos.AuthResult login(AuthDtos.LoginRequest req) {
        User u = userRepository.findByEmailIgnoreCase(req.email().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль"));
        if (!passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль");
        }
        String portal = req.portal().trim().toUpperCase();
        if ("TEACHER".equals(portal)) {
            if (u.getRole() != Role.TEACHER && u.getRole() != Role.ADMIN) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет прав учителя. Обратитесь к администратору.");
            }
        }
        if (!"STUDENT".equals(portal) && !"TEACHER".equals(portal)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "portal должен быть STUDENT или TEACHER");
        }
        return toResult(u);
    }

    public AuthDtos.UserProfile me(Long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return new AuthDtos.UserProfile(u.getId(), u.getEmail(), u.getDisplayName(), u.getRole());
    }

    private AuthDtos.AuthResult toResult(User u) {
        String token = jwtService.generateToken(u.getId(), u.getEmail(), u.getRole());
        return new AuthDtos.AuthResult(token, new AuthDtos.UserProfile(u.getId(), u.getEmail(), u.getDisplayName(), u.getRole()));
    }
}
