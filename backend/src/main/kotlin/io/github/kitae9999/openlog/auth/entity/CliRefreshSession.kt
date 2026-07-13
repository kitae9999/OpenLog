package io.github.kitae9999.openlog.auth.entity

import io.github.kitae9999.openlog.user.entity.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "cli_refresh_sessions")
class CliRefreshSession(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    tokenHash: String,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    lastRotatedAt: LocalDateTime? = null,
) {
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    var tokenHash: String = tokenHash
        protected set

    @Column(name = "last_rotated_at")
    var lastRotatedAt: LocalDateTime? = lastRotatedAt
        protected set

    fun rotate(nextTokenHash: String, rotatedAt: LocalDateTime) {
        tokenHash = nextTokenHash
        lastRotatedAt = rotatedAt
    }

    fun isExpired(now: LocalDateTime): Boolean = !expiresAt.isAfter(now)
}
