package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.common.event.payload.PostPublishedAuthorPayload
import io.github.kitae9999.openlog.common.event.payload.PostPublishedEventPayload
import io.github.kitae9999.openlog.common.event.payload.PostPublishedPostPayload
import io.github.kitae9999.openlog.follow.FollowRepository
import io.github.kitae9999.openlog.follow.entity.Follow
import io.github.kitae9999.openlog.notification.entity.Notification
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.mockingDetails
import org.mockito.junit.jupiter.MockitoExtension
import java.time.Instant
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

    private lateinit var notificationService: NotificationService

    @BeforeEach
    fun setUp() {
        notificationService = NotificationService(
            notificationRepository = notificationRepository,
            followRepository = followRepository,
            userRepository = userRepository,
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
        val notifications = mockingDetails(notificationRepository).invocations
            .single { it.method.name == "saveAll" }
            .arguments
            .single() as List<Notification>

        assertThat(notifications).hasSize(1)
        assertThat(notifications.single().recipient).isSameAs(follower)
        assertThat(notifications.single().actor).isSameAs(author)
        assertThat(notifications.single().sourceEventId).isEqualTo(eventId)
        assertThat(notifications.single().payload["author"].toString()).contains("kitae9999")
    }
}
