package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.notification.entity.Notification
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository

interface NotificationRepository: JpaRepository<Notification, Long> {
    @EntityGraph(attributePaths = ["actor"])
    fun findAllByRecipient_IdOrderByCreatedAtDescIdDesc(recipientId: Long, pageable: Pageable): List<Notification>

    fun countByRecipient_IdAndReadAtIsNull(recipientId: Long): Long
}
