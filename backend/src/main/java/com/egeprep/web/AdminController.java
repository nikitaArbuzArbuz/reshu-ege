package com.egeprep.web;

import com.egeprep.dto.AdminDtos;
import com.egeprep.service.AdminService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<AdminDtos.UserRow> users() {
        return adminService.listUsers();
    }

    @PostMapping("/users/{userId}/grant-teacher")
    public AdminDtos.UserRow grantTeacher(@PathVariable Long userId) {
        return adminService.grantTeacher(userId);
    }
}
