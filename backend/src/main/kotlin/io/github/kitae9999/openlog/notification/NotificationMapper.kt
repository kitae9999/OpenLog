package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.notification.dto.NotificationActorResponse
import io.github.kitae9999.openlog.notification.dto.NotificationResponse
import io.github.kitae9999.openlog.notification.entity.Notification
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.stereotype.Component

@Component
class NotificationMapper {
    fun toResponse(notification: Notification): NotificationResponse {
        return NotificationResponse(
            id = requireNotNull(notification.id),
            type = notification.type,
            targetDomain = notification.targetDomain,
            targetId = notification.targetId,
            payload = notification.payload,
            actor = notification.actor?.let(::toActorResponse),
            readAt = notification.readAt,
            createdAt = notification.createdAt,
            unread = notification.readAt == null,
        )
    }

    private fun toActorResponse(user: User): NotificationActorResponse {
        return NotificationActorResponse(
            id = requireNotNull(user.id),
            username = user.username,
            nickname = user.nickname,
            profileImageUrl = user.profileImageUrl,
        )
    }
}
