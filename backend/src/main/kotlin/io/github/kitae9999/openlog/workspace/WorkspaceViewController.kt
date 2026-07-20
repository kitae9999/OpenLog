package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.WorkspaceActivityViewResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceGraphViewResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspacePlannerViewResponse
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/workspaces/{workspaceId}")
class WorkspaceViewController(
    private val workspaceViewService: WorkspaceViewService,
) {
    @GetMapping("/planner-view")
    fun getPlannerView(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
    ): WorkspacePlannerViewResponse {
        return workspaceViewService.getPlannerView(requireNotNull(user.id), workspaceId, from, to)
    }

    @GetMapping("/graph-view")
    fun getGraphView(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): WorkspaceGraphViewResponse {
        return workspaceViewService.getGraphView(requireNotNull(user.id), workspaceId)
    }

    @GetMapping("/activity-view")
    fun getActivityView(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
    ): WorkspaceActivityViewResponse {
        return workspaceViewService.getActivityView(requireNotNull(user.id), workspaceId, from, to, date)
    }
}
