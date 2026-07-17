package io.github.kitae9999.openlog.auth.mcp

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties("auth.mcp")
data class McpOAuthProperties(
    var enabled: Boolean = false,
    var issuer: String = "http://localhost:8080/api",
    var resource: String = "http://localhost:8090/mcp",
    var internalApiResource: String = "http://localhost:8080/api",
    var frontendConsentUrl: String = "http://localhost:3030/mcp-consent",
    var serviceClientId: String = "openlog-mcp-service",
    var serviceClientSecret: String = "change-me",
    var accessTokenTtl: Duration = Duration.ofMinutes(10),
    var refreshTokenTtl: Duration = Duration.ofDays(30),
    var internalTokenTtl: Duration = Duration.ofSeconds(60),
)
