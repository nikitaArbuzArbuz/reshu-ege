package com.egeprep.security;

import com.egeprep.config.AppSecurityProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class AuthCookieHelper {

    private final AppSecurityProperties props;
    private final long expirationMs;

    public AuthCookieHelper(
            AppSecurityProperties props,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs
    ) {
        this.props = props;
        this.expirationMs = expirationMs;
    }

    public ResponseCookie createAccessCookie(String jwt, HttpServletRequest request) {
        boolean secure = request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
        return ResponseCookie.from(props.getJwtCookieName(), jwt)
                .httpOnly(true)
                .secure(secure)
                .path(props.getJwtCookiePath())
                .maxAge(Duration.ofMillis(expirationMs))
                .sameSite("Lax")
                .build();
    }

    public ResponseCookie clearAccessCookie(HttpServletRequest request) {
        boolean secure = request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
        return ResponseCookie.from(props.getJwtCookieName(), "")
                .httpOnly(true)
                .secure(secure)
                .path(props.getJwtCookiePath())
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }
}
