package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.activity.ActivityService
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.memory.MemoryService
import io.github.kitae9999.openlog.output.OutputService
import io.github.kitae9999.openlog.todo.TodoService
import io.github.kitae9999.openlog.workingbrief.WorkingBriefService
import io.github.kitae9999.openlog.workspace.dto.WorkspaceDashboardResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
class WorkspaceDashboardService(
    private val workspaceTaskService: WorkspaceTaskService,
    private val workspaceLogService: WorkspaceLogService,
    private val workspaceLinkService: WorkspaceLinkService,
    private val todoService: TodoService,
    private val outputService: OutputService,
    private val memoryService: MemoryService,
    private val workingBriefService: WorkingBriefService,
    private val activityService: ActivityService,
) {
    @Transactional(readOnly = true)
    fun getDashboard(
        userId: Long,
        workspaceId: Long,
        from: LocalDate,
        to: LocalDate,
    ): WorkspaceDashboardResponse {
        return WorkspaceDashboardResponse(
            tasks = workspaceTaskService.getTasks(
                userId = userId,
                workspaceId = workspaceId,
                status = null,
                cursor = null,
                size = DASHBOARD_TASK_LIMIT,
            ).tasks,
            logs = workspaceLogService.getLogs(
                userId = userId,
                workspaceId = workspaceId,
                taskId = null,
                cursor = null,
                size = DASHBOARD_LOG_LIMIT,
            ).logs,
            taskLinks = workspaceLinkService.getTaskLinks(userId, workspaceId),
            logLinks = workspaceLinkService.getLogLinks(userId, workspaceId),
            crossLinks = workspaceLinkService.getCrossLinks(userId, workspaceId),
            todos = todoService.getTodos(userId, workspaceId, to),
            outputs = outputService.getRecentOutputs(userId, workspaceId, DASHBOARD_OUTPUT_LIMIT),
            memories = memoryService.getMemories(
                userId = userId,
                workspaceId = workspaceId,
                cursor = null,
                size = DASHBOARD_MEMORY_LIMIT,
            ).memories,
            workingBrief = try {
                workingBriefService.getBrief(userId, workspaceId)
            } catch (_: NotFoundException) {
                null
            },
            activity = activityService.getActivity(userId, workspaceId, from, to),
        )
    }

    private companion object {
        private const val DASHBOARD_TASK_LIMIT = 20
        private const val DASHBOARD_LOG_LIMIT = 6
        private const val DASHBOARD_OUTPUT_LIMIT = 1
        private const val DASHBOARD_MEMORY_LIMIT = 8
    }
}
