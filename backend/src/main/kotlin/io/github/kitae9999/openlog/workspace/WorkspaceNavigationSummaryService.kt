package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.workspace.dto.WorkspaceNavigationSummaryResponse
import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogStatus
import io.github.kitae9999.openlog.workspace.entity.TaskStatus
import io.github.kitae9999.openlog.workspace.repository.WorkspaceLogRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceTaskRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkspaceNavigationSummaryService(
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val workspaceTaskRepository: WorkspaceTaskRepository,
    private val workspaceLogRepository: WorkspaceLogRepository,
) {
    @Transactional(readOnly = true)
    fun getSummary(userId: Long, workspaceId: Long): WorkspaceNavigationSummaryResponse {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val activeTaskCount = workspaceTaskRepository.countByWorkspaceIdAndStatusIn(
            workspaceId,
            listOf(TaskStatus.TODO, TaskStatus.DOING),
        )

        return WorkspaceNavigationSummaryResponse(
            activeTaskCount = activeTaskCount,
            logsCount = workspaceLogRepository.countByWorkspaceId(workspaceId),
            openIssuesCount = workspaceLogRepository.countByWorkspaceIdAndKindAndStatus(
                workspaceId,
                LogKind.ISSUE,
                LogStatus.OPEN,
            ),
        )
    }
}
