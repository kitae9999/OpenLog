package io.github.kitae9999.openlog.auth.mcp

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface McpConnectionRepository : JpaRepository<McpConnection, UUID> {
    fun findAllByUserIdAndRevokedAtIsNullOrderByCreatedAtDesc(userId: Long): List<McpConnection>

    fun findByIdAndUserIdAndRevokedAtIsNull(id: UUID, userId: Long): McpConnection?

    fun findByUserIdAndRegisteredClientIdAndRevokedAtIsNull(
        userId: Long,
        registeredClientId: String,
    ): McpConnection?
}
