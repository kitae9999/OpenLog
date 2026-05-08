package io.github.kitae9999.openlog.notification

import org.apache.kafka.clients.consumer.ConsumerRecord
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.mockingDetails
import org.mockito.junit.jupiter.MockitoExtension
import tools.jackson.databind.ObjectMapper
import java.nio.charset.StandardCharsets
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class NotificationEventHandlerTest {
    @Mock
    private lateinit var notificationService: NotificationService

    private lateinit var handler: NotificationEventHandler

    @BeforeEach
    fun setUp() {
        handler = NotificationEventHandler(
            notificationService = notificationService,
            objectMapper = ObjectMapper(),
        )
    }

    @Test
    fun `handlePostEvents reads Debezium byte headers and dispatches post published event`() {
        val eventId = UUID.randomUUID()
        val record = ConsumerRecord(
            "post-events",
            1,
            0,
            "20",
            """
            {
              "post": {
                "id": 20,
                "slug": "adsad",
                "title": "adsad"
              },
              "author": {
                "id": 8,
                "nickname": "ASH",
                "username": "kitae9999",
                "profileImageUrl": null
              },
              "eventCreatedAt": "2026-05-08T16:31:52.225190Z"
            }
            """.trimIndent(),
        )
        record.headers().add("eventType", "POST_PUBLISHED".toByteArray(StandardCharsets.UTF_8))
        record.headers().add("id", eventId.toString().toByteArray(StandardCharsets.UTF_8))

        handler.handlePostEvents(record)

        val invocation = mockingDetails(notificationService).invocations
            .single { it.method.name == "sendPostPublishedNotification" }
        assertThat(invocation.arguments[0]).isEqualTo(eventId)
        assertThat(invocation.arguments[1].toString()).contains("kitae9999")
    }
}
