package io.github.kitae9999.openlog.auth.mcp

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@ConditionalOnProperty(prefix = "auth.mcp", name = ["enabled"], havingValue = "true")
class McpProtectedResourceMetadataController(
    private val properties: McpOAuthProperties,
) {
    @GetMapping("/.well-known/oauth-protected-resource/mcp")
    fun metadata(): Map<String, Any> = mapOf(
        "resource" to properties.resource,
        "authorization_servers" to listOf(properties.issuer),
        "scopes_supported" to listOf("mcp:tools"),
        "bearer_methods_supported" to listOf("header"),
        "resource_name" to "OpenLog Remote MCP",
    )
}
