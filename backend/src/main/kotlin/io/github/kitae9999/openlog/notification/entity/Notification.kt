package io.github.kitae9999.openlog.notification.entity

import io.github.kitae9999.openlog.user.entity.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "notifications")
class Notification(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    recipient: User,
    actor: User?,
    sourceEventId: UUID,
    type: NotificationType,
    targetDomain: String,
    targetId: String,
    payload: Map<String, Any?>,
    createdAt: OffsetDateTime = OffsetDateTime.now(),
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    var recipient: User = recipient
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    var actor: User? = actor
        protected set

    @Column(name = "source_event_id", nullable = false)
    var sourceEventId: UUID = sourceEventId
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    var type: NotificationType = type
        protected set

    @Column(name = "target_domain", nullable = false, length = 100)
    var targetDomain: String = targetDomain
        protected set

    @Column(name = "target_id", nullable = false)
    var targetId: String = targetId
        protected set

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    var payload: Map<String, Any?> = payload
        protected set

    @Column(name = "read_at")
    var readAt: OffsetDateTime? = null
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: OffsetDateTime = createdAt
        protected set

    fun markRead(readAt: OffsetDateTime = OffsetDateTime.now()) {
        if (this.readAt != null) {
            return
        }

        this.readAt = readAt
    }
}
