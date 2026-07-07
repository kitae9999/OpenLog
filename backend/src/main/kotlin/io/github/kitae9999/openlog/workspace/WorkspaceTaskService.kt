package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursor
import io.github.kitae9999.openlog.common.resolveAuthorName
import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursorCodec
import io.github.kitae9999.openlog.workspace.entity.TaskStatus
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import io.github.kitae9999.openlog.workspace.repository.WorkspaceTaskRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateTaskRequest
import io.github.kitae9999.openlog.workspace.dto.TaskAuthorResponse
import io.github.kitae9999.openlog.workspace.dto.TaskDetailResponse
import io.github.kitae9999.openlog.workspace.dto.UpdateTaskRequest
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskResponse
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkspaceTaskService(
    private val workspaceTaskRepository: WorkspaceTaskRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
) {
    @Transactional(readOnly = true)
    fun getTasks(
        userId: Long,
        workspaceId: Long,
        status: TaskStatus?,
        cursor: String?,
        size: Int,
    ): WorkspaceTaskCursorResponse {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)

        return findTasksByCursor(
            cursor = cursor,
            size = size,
            findFirstPage = { pageable ->
                if (status == null) {
                    workspaceTaskRepository.findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(
                        workspaceId = workspaceId,
                        pageable = pageable,
                    )
                } else {
                    workspaceTaskRepository.findAllByWorkspaceIdAndStatusOrderByUpdatedAtDescIdDesc(
                        workspaceId = workspaceId,
                        status = status,
                        pageable = pageable,
                    )
                }
            },
            findAfterCursor = { cursorMarker, pageable ->
                if (status == null) {
                    workspaceTaskRepository.findWorkspaceTasksAfterCursor(
                        workspaceId = workspaceId,
                        updatedAt = cursorMarker.createdAt,
                        id = cursorMarker.id,
                        pageable = pageable,
                    )
                } else {
                    workspaceTaskRepository.findWorkspaceTasksByStatusAfterCursor(
                        workspaceId = workspaceId,
                        status = status,
                        updatedAt = cursorMarker.createdAt,
                        id = cursorMarker.id,
                        pageable = pageable,
                    )
                }
            },
        )
    }

    @Transactional(readOnly = true)
    fun getTaskDetail(userId: Long, workspaceId: Long, taskId: Long): TaskDetailResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val task = workspaceAccessResolver.requireOwnedTask(workspace, taskId)

        return TaskDetailResponse(
            id = requireNotNull(task.id),
            title = task.title,
            description = task.description,
            content = task.content,
            status = task.status,
            author = TaskAuthorResponse(
                id = requireNotNull(task.author.id),
                username = task.author.username,
                nickname = task.author.nickname,
                profileImageUrl = task.author.profileImageUrl
            ),
            createdAt = task.createdAt.toString(),
            updatedAt = task.updatedAt.toString(),
        )
    }

    @Transactional
    fun createTask(user: User, workspaceId: Long, request: CreateTaskRequest): WorkspaceTaskResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(requireNotNull(user.id), workspaceId)
        val task = WorkspaceTask(
            workspace = workspace,
            author = user,
            title = request.title.trim(),
            description = request.description?.trim()?.takeIf { it.isNotEmpty() },
            content = request.content?.trim()?.takeIf { it.isNotEmpty() },
            status = request.status,
        )
        val savedTask = workspaceTaskRepository.save(task)

        return toResponse(savedTask)
    }

    @Transactional
    fun updateTask(
        userId: Long,
        workspaceId: Long,
        taskId: Long,
        request: UpdateTaskRequest,
    ): WorkspaceTaskResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val task = workspaceAccessResolver.requireOwnedTask(workspace, taskId)

        task.update(
            title = request.title.trim(),
            description = request.description?.trim()?.takeIf { it.isNotEmpty() },
            content = request.content?.trim()?.takeIf { it.isNotEmpty() },
            status = request.status,
        )

        return toResponse(task)
    }

    @Transactional
    fun deleteTask(userId: Long, workspaceId: Long, taskId: Long) {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val task = workspaceAccessResolver.requireOwnedTask(workspace, taskId)

        workspaceTaskRepository.delete(task)
    }

    private fun findTasksByCursor(
        cursor: String?,
        size: Int,
        findFirstPage: (PageRequest) -> List<WorkspaceTask>,
        findAfterCursor: (DateTimeIdCursor, PageRequest) -> List<WorkspaceTask>,
    ): WorkspaceTaskCursorResponse {
        val safeSize = size.coerceIn(1, WORKSPACE_TASKS_PAGE_SIZE)
        val cursorMarker = cursor?.let(DateTimeIdCursorCodec::decode)
        val pageable = PageRequest.of(0, safeSize + 1)
        val tasks = if (cursorMarker == null) {
            findFirstPage(pageable)
        } else {
            findAfterCursor(cursorMarker, pageable)
        }

        return toCursorResponse(tasks, safeSize)
    }

    private fun toCursorResponse(tasks: List<WorkspaceTask>, safeSize: Int): WorkspaceTaskCursorResponse {
        val hasNext = tasks.size > safeSize
        val pageTasks = tasks.take(safeSize)

        return WorkspaceTaskCursorResponse(
            tasks = pageTasks.map(::toResponse),
            size = safeSize,
            nextCursor = pageTasks.lastOrNull()
                ?.takeIf { hasNext }
                ?.let { task -> DateTimeIdCursorCodec.encode(task.updatedAt, requireNotNull(task.id)) },
            hasNext = hasNext,
        )
    }

    private fun toResponse(task: WorkspaceTask): WorkspaceTaskResponse {
        val author = task.author

        return WorkspaceTaskResponse(
            id = requireNotNull(task.id),
            title = task.title,
            description = task.description,
            content = task.content,
            status = task.status,
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            createdAt = task.createdAt.toString(),
            updatedAt = task.updatedAt.toString(),
        )
    }

    companion object {
        private const val WORKSPACE_TASKS_PAGE_SIZE = 20
    }
}
