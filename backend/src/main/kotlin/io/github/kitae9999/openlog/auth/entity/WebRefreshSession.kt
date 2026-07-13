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
@Table(name = "web_refresh_sessions")
class WebRefreshSession(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    val tokenHash: String,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    lastUsedAt: LocalDateTime? = null,
) {
    @Column(name = "last_used_at")
    var lastUsedAt: LocalDateTime? = lastUsedAt
        protected set

    fun markUsed(usedAt: LocalDateTime) {
        lastUsedAt = usedAt
    }

    fun isExpired(now: LocalDateTime): Boolean = !expiresAt.isAfter(now)
}
