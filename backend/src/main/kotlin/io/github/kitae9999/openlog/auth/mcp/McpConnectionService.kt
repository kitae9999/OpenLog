package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
class McpConnectionService(
    private val connectionRepository: McpConnectionRepository,
    private val jdbcTemplate: JdbcTemplate,
) {
    @Transactional(readOnly = true)
    fun list(userId: Long): List<McpConnectionResponse> = connectionRepository
        .findAllByUserIdAndRevokedAtIsNullOrderByCreatedAtDesc(userId)
        .map(McpConnection::toResponse)

    @Transactional
    fun approve(
        user: User,
        registeredClientId: String,
        clientId: String,
        clientName: String,
        callbackOrigin: String,
        permissionProfile: McpPermissionProfile,
    ): McpConnection {
        val userId = requireNotNull(user.id)
        val now = Instant.now()
        val connection = connectionRepository
            .findByUserIdAndRegisteredClientIdAndRevokedAtIsNull(userId, registeredClientId)
            ?: McpConnection(
                user = user,
                registeredClientId = registeredClientId,
                clientId = clientId,
                clientName = clientName,
                callbackOrigin = callbackOrigin,
                permissionProfile = permissionProfile,
                createdAt = now,
            )

        connection.approve(
            clientId = clientId,
            clientName = clientName,
            callbackOrigin = callbackOrigin,
            permissionProfile = permissionProfile,
            now = now,
        )
        return connectionRepository.save(connection)
    }

    @Transactional
    fun update(userId: Long, connectionId: UUID, profile: McpPermissionProfile): McpConnectionResponse {
        val connection = requireOwnedActiveConnection(userId, connectionId)
        connection.changePermissionProfile(profile, Instant.now())
        return connection.toResponse()
    }

    @Transactional
    fun revoke(userId: Long, connectionId: UUID) {
        val connection = requireOwnedActiveConnection(userId, connectionId)
        connection.revoke(Instant.now())

        val principalName = userId.toString()
        jdbcTemplate.update(
            "delete from oauth2_authorization where registered_client_id = ? and principal_name = ?",
            connection.registeredClientId,
            principalName,
        )
        jdbcTemplate.update(
            "delete from oauth2_authorization_consent where registered_client_id = ? and principal_name = ?",
            connection.registeredClientId,
            principalName,
        )
    }

    @Transactional(readOnly = true)
    fun findActive(userId: Long, registeredClientId: String): McpConnection? = connectionRepository
        .findByUserIdAndRegisteredClientIdAndRevokedAtIsNull(userId, registeredClientId)

    @Transactional(readOnly = true)
    fun findActive(connectionId: UUID): McpConnection? = connectionRepository.findById(connectionId)
        .filter { it.revokedAt == null }
        .orElse(null)

    private fun requireOwnedActiveConnection(userId: Long, connectionId: UUID): McpConnection =
        connectionRepository.findByIdAndUserIdAndRevokedAtIsNull(connectionId, userId)
            ?: throw NotFoundException("MCP 연결을 찾을 수 없습니다.")
}

private fun McpConnection.toResponse(): McpConnectionResponse = McpConnectionResponse(
    id = id,
    clientId = clientId,
    clientName = clientName,
    callbackOrigin = callbackOrigin,
    permissionProfile = permissionProfile.wireValue,
    createdAt = createdAt,
    updatedAt = updatedAt,
)
