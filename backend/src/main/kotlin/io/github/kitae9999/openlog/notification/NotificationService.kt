package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.common.event.payload.PostPublishedEventPayload
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.follow.FollowRepository
import io.github.kitae9999.openlog.notification.dto.NotificationListResponse
import io.github.kitae9999.openlog.notification.dto.NotificationReadResponse
import io.github.kitae9999.openlog.notification.entity.Notification
import io.github.kitae9999.openlog.notification.entity.NotificationType
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
    private val notificationJdbcWriter: NotificationJdbcWriter,
    private val notificationMapper: NotificationMapper,
) {
    @Transactional(readOnly = true)
    fun getNotifications(recipientId: Long, size: Int): NotificationListResponse {
        val safeSize = size.coerceIn(1, NOTIFICATIONS_PAGE_SIZE) // size 변수를 지정한 범위의 값으로 자름
        val notifications = notificationRepository.findAllByRecipient_IdOrderByCreatedAtDescIdDesc(
            recipientId = recipientId,
            pageable = PageRequest.of(0, safeSize),
        )

        return NotificationListResponse(
            notifications = notifications.map(notificationMapper::toResponse),
            size = safeSize,
            unreadCount = notificationRepository.countByRecipient_IdAndReadAtIsNull(recipientId),
        )
    }

    @Transactional
    fun markNotificationRead(recipientId: Long, notificationId: Long): NotificationReadResponse {
        val notification = notificationRepository.findByIdAndRecipient_Id(
            notificationId = notificationId,
            recipientId = recipientId,
        ) ?: throw NotFoundException("알림을 찾을 수 없습니다.")

        notification.markRead()

        return NotificationReadResponse(
            notification = notificationMapper.toResponse(notification),
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

        notificationJdbcWriter.insertIgnoringDuplicates(notifications)
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
