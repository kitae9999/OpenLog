package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.common.event.payload.PostPublishedAuthorPayload
import io.github.kitae9999.openlog.common.event.payload.PostPublishedEventPayload
import io.github.kitae9999.openlog.common.event.payload.PostPublishedPostPayload
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.follow.FollowRepository
import io.github.kitae9999.openlog.follow.entity.Follow
import io.github.kitae9999.openlog.notification.entity.Notification
import io.github.kitae9999.openlog.notification.entity.NotificationType
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.mockingDetails
import org.mockito.junit.jupiter.MockitoExtension
import java.time.Instant
import java.time.OffsetDateTime
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class NotificationServiceTest {
    @Mock
    private lateinit var notificationRepository: NotificationRepository

    @Mock
    private lateinit var followRepository: FollowRepository

    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var notificationJdbcWriter: NotificationJdbcWriter

    private lateinit var notificationService: NotificationService

    @BeforeEach
    fun setUp() {
        notificationService = NotificationService(
            notificationRepository = notificationRepository,
            followRepository = followRepository,
            userRepository = userRepository,
            notificationJdbcWriter = notificationJdbcWriter,
        )
    }

    @Test
    fun `sendPostPublishedNotification saves notifications for author followers`() {
        val author = User(id = 8L, username = "kitae9999", nickname = "ASH")
        val follower = User(id = 9L, username = "gitae9999", nickname = "oreolover")
        val eventId = UUID.randomUUID()

        given(userRepository.findById(8L)).willReturn(Optional.of(author))
        given(followRepository.findAllByFollowedUser_IdOrderByCreatedAtDesc(8L))
            .willReturn(listOf(Follow(followingUser = follower, followedUser = author)))

        notificationService.sendPostPublishedNotification(
            eventId = eventId,
            payload = PostPublishedEventPayload(
                post = PostPublishedPostPayload(
                    id = 20L,
                    title = "adsad",
                    slug = "adsad",
                ),
                author = PostPublishedAuthorPayload(
                    id = 8L,
                    username = "kitae9999",
                    nickname = "ASH",
                    profileImageUrl = null,
                ),
                eventCreatedAt = Instant.parse("2026-05-08T16:31:52.225190Z"),
            ),
        )

        @Suppress("UNCHECKED_CAST")
        val notifications = mockingDetails(notificationJdbcWriter).invocations
            .single { it.method.name == "insertIgnoringDuplicates" }
            .arguments
            .single() as List<Notification>

        assertThat(notifications).hasSize(1)
        assertThat(notifications.single().recipient).isSameAs(follower)
        assertThat(notifications.single().actor).isSameAs(author)
        assertThat(notifications.single().sourceEventId).isEqualTo(eventId)
        assertThat(notifications.single().payload["author"].toString()).contains("kitae9999")
    }

    @Test
    fun `markNotificationRead marks unread notification as read`() {
        val notification = createNotification()

        given(notificationRepository.findByIdAndRecipient_Id(1L, 9L)).willReturn(notification)
        given(notificationRepository.countByRecipient_IdAndReadAtIsNull(9L)).willReturn(2L)

        val response = notificationService.markNotificationRead(
            recipientId = 9L,
            notificationId = 1L,
        )

        assertThat(notification.readAt).isNotNull()
        assertThat(response.notification.id).isEqualTo(1L)
        assertThat(response.notification.unread).isFalse()
        assertThat(response.notification.readAt).isEqualTo(notification.readAt)
        assertThat(response.unreadCount).isEqualTo(2L)
    }

    @Test
    fun `markNotificationRead keeps existing readAt for already read notification`() {
        val readAt = OffsetDateTime.parse("2026-05-08T17:00:00Z")
        val notification = createNotification()
        notification.markRead(readAt)

        given(notificationRepository.findByIdAndRecipient_Id(1L, 9L)).willReturn(notification)
        given(notificationRepository.countByRecipient_IdAndReadAtIsNull(9L)).willReturn(0L)

        val response = notificationService.markNotificationRead(
            recipientId = 9L,
            notificationId = 1L,
        )

        assertThat(notification.readAt).isEqualTo(readAt)
        assertThat(response.notification.readAt).isEqualTo(readAt)
        assertThat(response.notification.unread).isFalse()
        assertThat(response.unreadCount).isEqualTo(0L)
    }

    @Test
    fun `markNotificationRead throws NotFoundException when notification does not belong to recipient`() {
        given(notificationRepository.findByIdAndRecipient_Id(1L, 9L)).willReturn(null)

        assertThatThrownBy {
            notificationService.markNotificationRead(
                recipientId = 9L,
                notificationId = 1L,
            )
        }.isInstanceOf(NotFoundException::class.java)
    }

    private fun createNotification(): Notification {
        val author = User(id = 8L, username = "kitae9999", nickname = "ASH")
        val recipient = User(id = 9L, username = "gitae9999", nickname = "oreolover")

        return Notification(
            id = 1L,
            recipient = recipient,
            actor = author,
            sourceEventId = UUID.randomUUID(),
            type = NotificationType.POST_PUBLISHED,
            targetDomain = "post",
            targetId = "20",
            payload = mapOf(
                "post" to mapOf(
                    "id" to 20L,
                    "title" to "adsad",
                    "slug" to "adsad",
                ),
                "author" to mapOf(
                    "id" to 8L,
                    "username" to "kitae9999",
                    "nickname" to "ASH",
                    "profileImageUrl" to null,
                ),
            ),
            createdAt = OffsetDateTime.parse("2026-05-08T16:31:52Z"),
        )
    }
}
