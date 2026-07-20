package io.github.kitae9999.openlog.app

import io.github.kitae9999.openlog.auth.dto.MeResponse
import io.github.kitae9999.openlog.auth.dto.toMeResponse
import io.github.kitae9999.openlog.notification.NotificationService
import io.github.kitae9999.openlog.notification.dto.NotificationSummaryResponse
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceNavigationSummaryService
import io.github.kitae9999.openlog.workspace.WorkspaceService
import io.github.kitae9999.openlog.workspace.dto.WorkspaceNavigationSummaryResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AppBootstrapService(
    private val workspaceService: WorkspaceService,
    private val workspaceNavigationSummaryService: WorkspaceNavigationSummaryService,
    private val notificationService: NotificationService,
) {
    @Transactional(readOnly = true)
    fun getBootstrap(user: User, requestedWorkspaceId: Long?): AppBootstrapResponse {
        val userId = requireNotNull(user.id)
        val workspaces = workspaceService.getWorkspaces(userId)
        val activeWorkspaceId = workspaces
            .firstOrNull { it.id == requestedWorkspaceId }
            ?.id
            ?: workspaces.firstOrNull()?.id

        return AppBootstrapResponse(
            user = user.toMeResponse(),
            workspaces = workspaces,
            activeWorkspaceId = activeWorkspaceId,
            navigationSummary = activeWorkspaceId?.let { workspaceId ->
                workspaceNavigationSummaryService.getSummary(userId, workspaceId)
            },
            notificationSummary = notificationService.getSummary(userId),
        )
    }
}

data class AppBootstrapResponse(
    val user: MeResponse,
    val workspaces: List<WorkspaceResponse>,
    val activeWorkspaceId: Long?,
    val navigationSummary: WorkspaceNavigationSummaryResponse?,
    val notificationSummary: NotificationSummaryResponse,
)
