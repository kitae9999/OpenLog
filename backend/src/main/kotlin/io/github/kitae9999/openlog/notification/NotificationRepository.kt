package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.notification.entity.Notification
import org.springframework.data.jpa.repository.JpaRepository

interface NotificationRepository: JpaRepository<Notification, Long> {
}