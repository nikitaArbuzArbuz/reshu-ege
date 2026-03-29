package com.egeprep.dto;

import com.egeprep.model.Role;

import java.time.Instant;

public class AdminDtos {

    public record UserRow(Long id, String email, String displayName, Role role, Instant createdAt) {
    }
}
