package com.egeprep.web;

import com.egeprep.model.Role;
import com.egeprep.security.AuthUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

    private CurrentUser() {
    }

    public static AuthUserDetails require() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUserDetails u)) {
            throw new IllegalStateException("Не авторизован");
        }
        return u;
    }

    public static boolean hasRole(Role role) {
        try {
            return require().role() == role;
        } catch (Exception e) {
            return false;
        }
    }
}
