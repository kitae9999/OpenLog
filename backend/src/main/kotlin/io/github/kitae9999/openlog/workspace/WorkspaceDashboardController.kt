package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.WorkspaceDashboardResponse
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/workspaces/{workspaceId}/dashboard")
class WorkspaceDashboardController(
    private val workspaceDashboardService: WorkspaceDashboardService,
) {
    @GetMapping
    fun getDashboard(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
    ): WorkspaceDashboardResponse {
        return workspaceDashboardService.getDashboard(requireNotNull(user.id), workspaceId, from, to)
    }
}
