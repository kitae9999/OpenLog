package io.github.kitae9999.openlog.notification.dto

import io.github.kitae9999.openlog.notification.entity.NotificationType
import java.time.OffsetDateTime

data class NotificationListResponse(
    val notifications: List<NotificationResponse>,
    val size: Int,
    val unreadCount: Long,
)

data class NotificationResponse(
    val id: Long,
    val type: NotificationType,
    val targetDomain: String,
    val targetId: String,
    val payload: Map<String, Any?>,
    val actor: NotificationActorResponse?,
    val readAt: OffsetDateTime?,
    val createdAt: OffsetDateTime,
    val unread: Boolean,
)

data class NotificationActorResponse(
    val id: Long,
    val username: String?,
    val nickname: String?,
    val profileImageUrl: String?,
)
