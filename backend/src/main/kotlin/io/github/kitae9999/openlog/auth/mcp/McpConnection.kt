package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.user.entity.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "mcp_connections")
class McpConnection(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "registered_client_id", nullable = false, length = 100)
    val registeredClientId: String,

    clientId: String,
    clientName: String,
    callbackOrigin: String,
    permissionProfile: McpPermissionProfile = McpPermissionProfile.SAFE_WRITE,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
) {
    @Column(name = "client_id", nullable = false, length = 100)
    var clientId: String = clientId
        protected set

    @Column(name = "client_name", nullable = false, length = 200)
    var clientName: String = clientName
        protected set

    @Column(name = "callback_origin", nullable = false, length = 500)
    var callbackOrigin: String = callbackOrigin
        protected set

    @Enumerated(EnumType.STRING)
    @Column(name = "permission_profile", nullable = false, length = 32)
    var permissionProfile: McpPermissionProfile = permissionProfile
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = createdAt
        protected set

    @Column(name = "revoked_at")
    var revokedAt: Instant? = null
        protected set

    fun approve(
        clientId: String,
        clientName: String,
        callbackOrigin: String,
        permissionProfile: McpPermissionProfile,
        now: Instant,
    ) {
        this.clientId = clientId
        this.clientName = clientName
        this.callbackOrigin = callbackOrigin
        this.permissionProfile = permissionProfile
        updatedAt = now
    }

    fun changePermissionProfile(permissionProfile: McpPermissionProfile, now: Instant) {
        this.permissionProfile = permissionProfile
        updatedAt = now
    }

    fun revoke(now: Instant) {
        revokedAt = now
        updatedAt = now
    }
}
