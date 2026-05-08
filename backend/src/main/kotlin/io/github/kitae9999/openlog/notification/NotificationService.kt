package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.common.event.payload.PostPublishedEventPayload
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class NotificationService {

    @Transactional
    fun sendPostPublishedNotification(payload: PostPublishedEventPayload){

    }
}