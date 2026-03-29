package com.egeprep.web;

import com.egeprep.dto.AuthDtos;
import com.egeprep.security.AuthCookieHelper;
import com.egeprep.security.AuthUserDetails;
import com.egeprep.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieHelper cookieHelper;

    public AuthController(AuthService authService, AuthCookieHelper cookieHelper) {
        this.authService = authService;
        this.cookieHelper = cookieHelper;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDtos.UserProfile> register(
            @Valid @RequestBody AuthDtos.RegisterRequest body,
            HttpServletRequest request
    ) {
        AuthDtos.AuthResult result = authService.register(body);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieHelper.createAccessCookie(result.accessToken(), request).toString())
                .body(result.user());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.UserProfile> login(
            @Valid @RequestBody AuthDtos.LoginRequest body,
            HttpServletRequest request
    ) {
        AuthDtos.AuthResult result = authService.login(body);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieHelper.createAccessCookie(result.accessToken(), request).toString())
                .body(result.user());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookieHelper.clearAccessCookie(request).toString())
                .build();
    }

    @GetMapping("/me")
    public AuthDtos.UserProfile me(@AuthenticationPrincipal AuthUserDetails user) {
        return authService.me(user.id());
    }
}
