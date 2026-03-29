package com.egeprep.dto;

import com.egeprep.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6, max = 100) String password,
            @NotBlank @Size(max = 120) String displayName
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotBlank String portal
    ) {
    }

    public record UserProfile(
            Long userId,
            String email,
            String displayName,
            Role role
    ) {
    }

    public record AuthResult(String accessToken, UserProfile user) {
    }
}
