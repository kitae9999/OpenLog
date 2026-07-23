package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.activity.ActivityService
import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.memory.MemoryService
import io.github.kitae9999.openlog.output.OutputService
import io.github.kitae9999.openlog.todo.TodoService
import io.github.kitae9999.openlog.workingbrief.WorkingBriefService
import io.github.kitae9999.openlog.workspace.dto.WorkspaceDashboardRefreshMode
import io.github.kitae9999.openlog.workspace.dto.WorkspaceDashboardRefreshResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceDashboardRefreshZone
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
    private val workspaceNavigationSummaryService: WorkspaceNavigationSummaryService,
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
            navigationSummary = workspaceNavigationSummaryService.getSummary(userId, workspaceId),
        )
    }

    @Transactional(readOnly = true)
    fun refreshDashboard(
        userId: Long,
        workspaceId: Long,
        zone: WorkspaceDashboardRefreshZone,
        entityIds: List<Long>,
        from: LocalDate,
        to: LocalDate,
    ): WorkspaceDashboardRefreshResponse {
        val distinctEntityIds = entityIds.distinct()
        if (distinctEntityIds.isEmpty()) {
            throw BadRequestException("Dashboard refresh에는 하나 이상의 entityId가 필요합니다.")
        }

        return when (zone) {
            WorkspaceDashboardRefreshZone.TASKS ->
                refreshTasks(userId, workspaceId, distinctEntityIds)
            WorkspaceDashboardRefreshZone.LOGS ->
                refreshLogs(userId, workspaceId, distinctEntityIds, from, to)
        }
    }

    private fun refreshTasks(
        userId: Long,
        workspaceId: Long,
        entityIds: List<Long>,
    ): WorkspaceDashboardRefreshResponse {
        if (entityIds.size == 1) {
            val task = workspaceTaskService.getTaskDetail(userId, workspaceId, entityIds.single())
            return WorkspaceDashboardRefreshResponse(
                zone = WorkspaceDashboardRefreshZone.TASKS,
                mode = WorkspaceDashboardRefreshMode.PATCH,
                task = task,
                navigationSummary = workspaceNavigationSummaryService.getSummary(userId, workspaceId),
            )
        }

        return WorkspaceDashboardRefreshResponse(
            zone = WorkspaceDashboardRefreshZone.TASKS,
            mode = WorkspaceDashboardRefreshMode.REPLACE,
            tasks = workspaceTaskService.getTasks(
                userId = userId,
                workspaceId = workspaceId,
                status = null,
                cursor = null,
                size = DASHBOARD_TASK_LIMIT,
            ).tasks,
            navigationSummary = workspaceNavigationSummaryService.getSummary(userId, workspaceId),
        )
    }

    private fun refreshLogs(
        userId: Long,
        workspaceId: Long,
        entityIds: List<Long>,
        from: LocalDate,
        to: LocalDate,
    ): WorkspaceDashboardRefreshResponse {
        if (entityIds.size == 1) {
            val log = workspaceLogService.getLogDetail(userId, workspaceId, entityIds.single())
            val linkedTask = log.taskId?.let { taskId ->
                workspaceTaskService.getTaskDetail(userId, workspaceId, taskId)
            }
            return WorkspaceDashboardRefreshResponse(
                zone = WorkspaceDashboardRefreshZone.LOGS,
                mode = WorkspaceDashboardRefreshMode.PATCH,
                log = log,
                linkedTask = linkedTask,
                navigationSummary = workspaceNavigationSummaryService.getSummary(userId, workspaceId),
                activity = activityService.getActivity(userId, workspaceId, from, to),
            )
        }

        return WorkspaceDashboardRefreshResponse(
            zone = WorkspaceDashboardRefreshZone.LOGS,
            mode = WorkspaceDashboardRefreshMode.REPLACE,
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
                size = REFRESH_LOG_LIMIT,
            ).logs,
            navigationSummary = workspaceNavigationSummaryService.getSummary(userId, workspaceId),
            activity = activityService.getActivity(userId, workspaceId, from, to),
        )
    }

    private companion object {
        private const val DASHBOARD_TASK_LIMIT = 20
        private const val DASHBOARD_LOG_LIMIT = 6
        private const val REFRESH_LOG_LIMIT = 20
        private const val DASHBOARD_OUTPUT_LIMIT = 1
        private const val DASHBOARD_MEMORY_LIMIT = 8
    }
}
