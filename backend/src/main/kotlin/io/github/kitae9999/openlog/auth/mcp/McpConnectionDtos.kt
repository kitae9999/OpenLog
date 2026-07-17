package io.github.kitae9999.openlog.auth.mcp

import jakarta.validation.constraints.Pattern
import java.time.Instant
import java.util.UUID

data class McpConnectionResponse(
    val id: UUID,
    val clientId: String,
    val clientName: String,
    val callbackOrigin: String,
    val permissionProfile: String,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class UpdateMcpConnectionRequest(
    @field:Pattern(regexp = "read-only|safe-write|full")
    val permissionProfile: String,
)
