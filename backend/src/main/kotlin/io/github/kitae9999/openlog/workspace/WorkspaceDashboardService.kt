package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.activity.ActivityService
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.memory.MemoryService
import io.github.kitae9999.openlog.memory.dto.MemoryResponse
import io.github.kitae9999.openlog.output.OutputService
import io.github.kitae9999.openlog.todo.TodoService
import io.github.kitae9999.openlog.workingbrief.WorkingBriefService
import io.github.kitae9999.openlog.workspace.dto.WorkspaceDashboardResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskResponse
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
            tasks = getAllTasks(userId, workspaceId),
            logs = getAllLogs(userId, workspaceId),
            taskLinks = workspaceLinkService.getTaskLinks(userId, workspaceId),
            logLinks = workspaceLinkService.getLogLinks(userId, workspaceId),
            crossLinks = workspaceLinkService.getCrossLinks(userId, workspaceId),
            todos = todoService.getAllTodos(userId, workspaceId),
            outputs = outputService.getOutputs(userId, workspaceId, null),
            memories = getAllMemories(userId, workspaceId),
            workingBrief = try {
                workingBriefService.getBrief(userId, workspaceId)
            } catch (_: NotFoundException) {
                null
            },
            activity = activityService.getActivity(userId, workspaceId, from, to),
        )
    }

    private fun getAllTasks(userId: Long, workspaceId: Long): List<WorkspaceTaskResponse> {
        val tasks = mutableListOf<WorkspaceTaskResponse>()
        var cursor: String? = null
        do {
            val page = workspaceTaskService.getTasks(userId, workspaceId, null, cursor, PAGE_SIZE)
            tasks += page.tasks
            cursor = page.nextCursor.takeIf { page.hasNext }
        } while (cursor != null)
        return tasks
    }

    private fun getAllLogs(userId: Long, workspaceId: Long): List<WorkspaceLogResponse> {
        val logs = mutableListOf<WorkspaceLogResponse>()
        var cursor: String? = null
        do {
            val page = workspaceLogService.getLogs(userId, workspaceId, null, cursor, PAGE_SIZE)
            logs += page.logs
            cursor = page.nextCursor.takeIf { page.hasNext }
        } while (cursor != null)
        return logs
    }

    private fun getAllMemories(userId: Long, workspaceId: Long): List<MemoryResponse> {
        val memories = mutableListOf<MemoryResponse>()
        var cursor: String? = null
        do {
            val page = memoryService.getMemories(userId, workspaceId, cursor, PAGE_SIZE)
            memories += page.memories
            cursor = page.nextCursor.takeIf { page.hasNext }
        } while (cursor != null)
        return memories
    }

    private companion object {
        private const val PAGE_SIZE = 50
    }
}
