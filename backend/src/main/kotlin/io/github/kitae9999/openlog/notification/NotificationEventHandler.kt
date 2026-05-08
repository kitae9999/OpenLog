package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.common.event.payload.PostPublishedEventPayload
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper
import java.nio.charset.StandardCharsets
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
        record: ConsumerRecord<String, String>,
    ){
        val eventType = record.headerValue("eventType") ?: return
        val eventId = record.headerValue("id") ?: return

        when (eventType){
            "POST_PUBLISHED" -> {
                val payload = objectMapper.readValue(
                    record.value(),
                    PostPublishedEventPayload::class.java,
                )

                notificationService.sendPostPublishedNotification(
                    UUID.fromString(eventId),
                    payload,
                )
            }
        }
    }

    private fun ConsumerRecord<String, String>.headerValue(name: String): String? {
        return headers().lastHeader(name)
            ?.value()
            ?.let { String(it, StandardCharsets.UTF_8) }
    }
}
