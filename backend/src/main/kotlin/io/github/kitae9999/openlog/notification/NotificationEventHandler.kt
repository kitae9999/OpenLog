package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.common.event.payload.PostPublishedEventPayload
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.messaging.handler.annotation.Header
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper
import java.util.UUID

@Component
class NotificationEventHandler (
    private val notificationService: NotificationService,
    private val objectMapper: ObjectMapper,
) {
    @KafkaListener(
        topics = ["post-events"],
        groupId = "openlog-notification"
    )
    fun handlePostEvents(
        payloadJson: String,
        @Header("eventType") eventType: String,
        @Header("id") eventId: String
    ){
        when (eventType){
            "POST_PUBLISHED" -> {
                val payload = objectMapper.readValue(
                    payloadJson,
                    PostPublishedEventPayload::class.java,
                )

                notificationService.sendPostPublishedNotification(
                    UUID.fromString(eventId),
                    payload,
                )
            }
        }
    }
}
