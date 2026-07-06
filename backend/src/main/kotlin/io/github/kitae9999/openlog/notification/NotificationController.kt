package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.notification.dto.NotificationListResponse
import io.github.kitae9999.openlog.notification.dto.NotificationReadResponse
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("notifications")
class NotificationController(
    private val notificationService: NotificationService,
) {
    @GetMapping
    fun getNotifications(
        @AuthenticationPrincipal user: User,
        @RequestParam(defaultValue = "20") size: Int,
    ): NotificationListResponse {
        return notificationService.getNotifications(
            recipientId = requireNotNull(user.id),
            size = size,
        )
    }

    @PatchMapping("{notificationId}/read")
    fun markNotificationRead(
        @AuthenticationPrincipal user: User,
        @PathVariable notificationId: Long,
    ): NotificationReadResponse {
        return notificationService.markNotificationRead(
            recipientId = requireNotNull(user.id),
            notificationId = notificationId,
        )
    }
}
