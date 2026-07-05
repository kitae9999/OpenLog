package io.github.kitae9999.openlog.worktask

import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursor
import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursorCodec
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.task.entity.TaskStatus
import io.github.kitae9999.openlog.task.entity.WorkspaceTask
import io.github.kitae9999.openlog.task.repository.WorkspaceTaskRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.worklog.entity.Workspace
import io.github.kitae9999.openlog.worklog.repository.WorkspaceRepository
import io.github.kitae9999.openlog.worktask.dto.WorkspaceTaskCursorResponse
import io.github.kitae9999.openlog.worktask.dto.WorkspaceTaskResponse
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class WorkspaceTaskService(
    private val workspaceTaskRepository: WorkspaceTaskRepository,
    private val workspaceRepository: WorkspaceRepository,
) {
    @Transactional(readOnly = true)
    fun getTasks(
        userId: Long,
        workspaceId: Long,
        status: TaskStatus?,
        cursor: String?,
        size: Int,
    ): WorkspaceTaskCursorResponse {
        resolveWorkspace(userId, workspaceId)

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

    private fun resolveWorkspace(userId: Long, workspaceId: Long): Workspace {
        val workspace = workspaceRepository.findById(workspaceId).getOrNull()
            ?: throw NotFoundException("워크스페이스를 찾을 수 없습니다.")

        if (workspace.owner.id != userId) {
            throw ForbiddenException("권한이 없는 요청입니다.")
        }

        return workspace
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

    private fun resolveAuthorName(user: User): String {
        return when {
            !user.nickname.isNullOrBlank() -> user.nickname.orEmpty()
            !user.username.isNullOrBlank() -> user.username.orEmpty()
            !user.email.isNullOrBlank() -> user.email.orEmpty()
            else -> "OpenLog member"
        }
    }

    companion object {
        private const val WORKSPACE_TASKS_PAGE_SIZE = 20
    }
}
