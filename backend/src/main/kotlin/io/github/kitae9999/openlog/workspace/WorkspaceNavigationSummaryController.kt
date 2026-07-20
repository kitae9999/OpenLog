package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.WorkspaceNavigationSummaryResponse
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/workspaces/{workspaceId}/navigation-summary")
class WorkspaceNavigationSummaryController(
    private val workspaceNavigationSummaryService: WorkspaceNavigationSummaryService,
) {
    @GetMapping
    fun getSummary(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): WorkspaceNavigationSummaryResponse {
        return workspaceNavigationSummaryService.getSummary(requireNotNull(user.id), workspaceId)
    }
}
