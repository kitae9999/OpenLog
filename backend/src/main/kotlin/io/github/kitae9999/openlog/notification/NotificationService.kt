package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.common.event.payload.PostPublishedEventPayload
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.follow.FollowRepository
import io.github.kitae9999.openlog.notification.entity.Notification
import io.github.kitae9999.openlog.notification.entity.NotificationType
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

@Service
class NotificationService (
    private val notificationRepository: NotificationRepository,
    private val followRepository: FollowRepository,
    private val userRepository: UserRepository,
    private val objectMapper: ObjectMapper,
) {

    @Transactional
    fun sendPostPublishedNotification(eventId: UUID, payload: PostPublishedEventPayload){
        val authorId = payload.author.id
        val author = userRepository.findById(authorId).getOrNull() ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val post = payload.post
        val notificationPayload = objectMapper.valueToTree<JsonNode>(payload)
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
}
