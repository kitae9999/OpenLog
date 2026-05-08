package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.notification.dto.NotificationListResponse
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("notifications")
class NotificationController(
    private val notificationService: NotificationService,
    private val currentUserResolver: CurrentUserResolver,
) {
    @GetMapping
    fun getNotifications(
        request: HttpServletRequest,
        @RequestParam(defaultValue = "20") size: Int,
    ): NotificationListResponse {
        val currentUser = currentUserResolver.resolveCurrentUser(request)

        return notificationService.getNotifications(
            recipientId = requireNotNull(currentUser.id),
            size = size,
        )
    }
}
