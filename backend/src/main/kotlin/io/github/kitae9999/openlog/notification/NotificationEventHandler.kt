package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.common.event.payload.PostPublishedEventPayload
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.messaging.handler.annotation.Header
import org.springframework.stereotype.Component

@Component
class NotificationEventHandler (
    private val notificationService: NotificationService
) {
    @KafkaListener(
        topics = ["post-events"],
        groupId = "openlog-notification"
    )
    fun handlePostEvents(
        payload: PostPublishedEventPayload,
        @Header("eventType") eventType: String
    ){
        when (eventType){
            "POST_PUBLISHED" -> notificationService.sendPostPublishedNotification(payload)
        }
    }
}