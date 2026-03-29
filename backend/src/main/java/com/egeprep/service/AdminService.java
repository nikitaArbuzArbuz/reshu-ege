package com.egeprep.service;

import com.egeprep.dto.AdminDtos;
import com.egeprep.model.Role;
import com.egeprep.model.User;
import com.egeprep.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.UserRow> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> new AdminDtos.UserRow(u.getId(), u.getEmail(), u.getDisplayName(), u.getRole(), u.getCreatedAt()))
                .sorted((a, b) -> Long.compare(a.id(), b.id()))
                .toList();
    }

    @Transactional
    public AdminDtos.UserRow grantTeacher(Long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (u.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Администратору не нужны права учителя");
        }
        u.setRole(Role.TEACHER);
        userRepository.save(u);
        return new AdminDtos.UserRow(u.getId(), u.getEmail(), u.getDisplayName(), u.getRole(), u.getCreatedAt());
    }
}
