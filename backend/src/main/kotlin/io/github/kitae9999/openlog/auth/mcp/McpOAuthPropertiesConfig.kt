package io.github.kitae9999.openlog.auth.mcp

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@EnableConfigurationProperties(McpOAuthProperties::class)
class McpOAuthPropertiesConfig
