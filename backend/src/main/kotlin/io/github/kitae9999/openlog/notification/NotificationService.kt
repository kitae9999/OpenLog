package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.common.event.payload.PostPublishedEventPayload
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.follow.FollowRepository
import io.github.kitae9999.openlog.notification.dto.NotificationActorResponse
import io.github.kitae9999.openlog.notification.dto.NotificationListResponse
import io.github.kitae9999.openlog.notification.dto.NotificationResponse
import io.github.kitae9999.openlog.notification.entity.Notification
import io.github.kitae9999.openlog.notification.entity.NotificationType
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

@Service
class NotificationService (
    private val notificationRepository: NotificationRepository,
    private val followRepository: FollowRepository,
    private val userRepository: UserRepository,
) {
    @Transactional(readOnly = true)
    fun getNotifications(recipientId: Long, size: Int): NotificationListResponse {
        val safeSize = size.coerceIn(1, NOTIFICATIONS_PAGE_SIZE) // size 변수를 지정한 범위의 값으로 자름
        val notifications = notificationRepository.findAllByRecipient_IdOrderByCreatedAtDescIdDesc(
            recipientId = recipientId,
            pageable = PageRequest.of(0, safeSize),
        )

        return NotificationListResponse(
            notifications = notifications.map { it.toResponse() },
            size = safeSize,
            unreadCount = notificationRepository.countByRecipient_IdAndReadAtIsNull(recipientId),
        )
    }

    @Transactional
    fun sendPostPublishedNotification(eventId: UUID, payload: PostPublishedEventPayload){
        val authorId = payload.author.id
        val author = userRepository.findById(authorId).getOrNull() ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val post = payload.post
        val notificationPayload = payload.toNotificationPayload()
        val createdAt = OffsetDateTime.ofInstant(payload.eventCreatedAt, ZoneOffset.UTC)

        val follows = followRepository.findAllByFollowedUser_IdOrderByCreatedAtDesc(authorId)

        val notifications = follows.map {
            Notification(
                recipient = it.followingUser,
                actor = author,
                sourceEventId = eventId,
                type = NotificationType.POST_PUBLISHED,
                targetDomain = "post",
                targetId = post.id.toString(),
                payload = notificationPayload,
                createdAt = createdAt,
            )
        }

        notificationRepository.saveAll(notifications)
    }

    private fun Notification.toResponse(): NotificationResponse {
        return NotificationResponse(
            id = requireNotNull(id),
            type = type,
            targetDomain = targetDomain,
            targetId = targetId,
            payload = payload,
            actor = actor?.toActorResponse(),
            readAt = readAt,
            createdAt = createdAt,
            unread = readAt == null,
        )
    }

    private fun User.toActorResponse(): NotificationActorResponse {
        return NotificationActorResponse(
            id = requireNotNull(id),
            username = username,
            nickname = nickname,
            profileImageUrl = profileImageUrl,
        )
    }

    private fun PostPublishedEventPayload.toNotificationPayload(): Map<String, Any?> {
        return mapOf(
            "post" to mapOf(
                "id" to post.id,
                "title" to post.title,
                "slug" to post.slug,
            ),
            "author" to mapOf(
                "id" to author.id,
                "username" to author.username,
                "nickname" to author.nickname,
                "profileImageUrl" to author.profileImageUrl,
            ),
            "eventCreatedAt" to eventCreatedAt.toString(),
        )
    }

    private companion object {
        private const val NOTIFICATIONS_PAGE_SIZE = 20
    }
}
