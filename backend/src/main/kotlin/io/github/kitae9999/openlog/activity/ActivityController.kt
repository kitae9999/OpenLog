package io.github.kitae9999.openlog.activity

import io.github.kitae9999.openlog.activity.dto.ActivityDayLogsResponse
import io.github.kitae9999.openlog.activity.dto.WorkspaceActivityResponse
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/workspaces/{workspaceId}/activity")
class ActivityController(
    private val activityService: ActivityService,
) {
    @GetMapping
    fun getActivity(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
    ): WorkspaceActivityResponse = activityService.getActivity(requireNotNull(user.id), workspaceId, from, to)

    @GetMapping("/{date}/logs")
    fun getDayLogs(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
    ): ActivityDayLogsResponse = activityService.getDayLogs(requireNotNull(user.id), workspaceId, date)
}
