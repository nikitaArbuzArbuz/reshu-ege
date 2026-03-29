package com.egeprep.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {

    private String corsAllowedOrigins = "http://localhost:3000,http://localhost:5173,https://localhost:3000";

    private String jwtCookieName = "ACCESS_TOKEN";

    private String jwtCookiePath = "/api";

    private int authRateLimitPerMinute = 30;

    public List<String> getCorsAllowedOrigins() {
        return Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public void setCorsAllowedOrigins(String corsAllowedOrigins) {
        this.corsAllowedOrigins = corsAllowedOrigins;
    }

    public String getJwtCookieName() {
        return jwtCookieName;
    }

    public void setJwtCookieName(String jwtCookieName) {
        this.jwtCookieName = jwtCookieName;
    }

    public String getJwtCookiePath() {
        return jwtCookiePath;
    }

    public void setJwtCookiePath(String jwtCookiePath) {
        this.jwtCookiePath = jwtCookiePath;
    }

    public int getAuthRateLimitPerMinute() {
        return authRateLimitPerMinute;
    }

    public void setAuthRateLimitPerMinute(int authRateLimitPerMinute) {
        this.authRateLimitPerMinute = authRateLimitPerMinute;
    }
}
