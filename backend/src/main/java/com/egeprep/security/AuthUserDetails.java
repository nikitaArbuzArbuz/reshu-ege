package com.egeprep.security;

import com.egeprep.model.Role;

public record AuthUserDetails(Long id, String email, Role role) {
}
