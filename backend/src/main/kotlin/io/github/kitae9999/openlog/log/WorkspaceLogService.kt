package io.github.kitae9999.openlog.log

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursor
import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursorCodec
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.log.dto.WorkspaceLogCursorResponse
import io.github.kitae9999.openlog.log.dto.WorkspaceLogResponse
import io.github.kitae9999.openlog.log.entity.LogKind
import io.github.kitae9999.openlog.log.entity.LogStatus
import io.github.kitae9999.openlog.log.entity.WorkspaceLog
import io.github.kitae9999.openlog.log.repository.WorkspaceLogRepository
import io.github.kitae9999.openlog.task.entity.WorkspaceTask
import io.github.kitae9999.openlog.task.repository.WorkspaceTaskRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.repository.WorkspaceRepository
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class WorkspaceLogService(
    private val workspaceLogRepository: WorkspaceLogRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceTaskRepository: WorkspaceTaskRepository,
) {
    @Transactional(readOnly = true)
    fun getLogs(userId: Long, workspaceId: Long, cursor: String?, size: Int): WorkspaceLogCursorResponse {
        resolveWorkspace(userId, workspaceId)

        return findLogsByCursor(
            cursor = cursor,
            size = size,
            findFirstPage = { pageable ->
                workspaceLogRepository.findAllByWorkspaceIdOrderByCreatedAtDescIdDesc(
                    workspaceId = workspaceId,
                    pageable = pageable,
                )
            },
            findAfterCursor = { cursorMarker, pageable ->
                workspaceLogRepository.findWorkspaceLogsAfterCursor(
                    workspaceId = workspaceId,
                    createdAt = cursorMarker.createdAt,
                    id = cursorMarker.id,
                    pageable = pageable,
                )
            },
        )
    }

    @Transactional(readOnly = true)
    fun getLogsByTask(
        userId: Long,
        taskId: Long,
        workspaceId: Long,
        cursor: String?,
        size: Int,
    ): WorkspaceLogCursorResponse {
        val workspace = resolveWorkspace(userId, workspaceId)
        resolveTask(workspace, taskId)

        return findLogsByCursor(
            cursor = cursor,
            size = size,
            findFirstPage = { pageable ->  // kotlin 람다
                workspaceLogRepository.findAllByTaskIdOrderByCreatedAtDescIdDesc(
                    taskId = taskId,
                    pageable = pageable,
                )
            },
            findAfterCursor = { cursorMarker, pageable ->
                workspaceLogRepository.findTaskLogsAfterCursor(
                    taskId = taskId,
                    createdAt = cursorMarker.createdAt,
                    id = cursorMarker.id,
                    pageable = pageable,
                )
            },
        )
    }

    @Transactional
    fun createLog(user: User, workspaceId: Long, request: CreateLogRequest): WorkspaceLogResponse {
        val workspace = resolveWorkspace(requireNotNull(user.id), workspaceId)
        val task = resolveTask(workspace, request.taskId)
        val title = request.title.trim()
        val content = request.content.trim()
        val summary = request.summary?.trim()?.takeIf { it.isNotEmpty() }
        val status = resolveStatus(request.kind, request.status)

        val log = WorkspaceLog(
            workspace = workspace,
            author = user,
            task = task,   
            kind = request.kind,
            status = status,
            title = title,
            summary = summary,
            content = content,
        )

        if (log.kind == LogKind.ISSUE && status == LogStatus.CLOSED) {
            log.closeIssue() // closed된 issue log를 만들 때 closedAt 컬럼을 채우기 위한 로직
        }

        val savedLog = workspaceLogRepository.save(log)

        return toResponse(savedLog)
    }

    private fun resolveWorkspace(userId: Long, workspaceId: Long): Workspace {
        val workspace = workspaceRepository.findById(workspaceId).getOrNull()
            ?: throw NotFoundException("워크스페이스를 찾을 수 없습니다.")

        if (workspace.owner.id != userId) {
            throw ForbiddenException("권한이 없는 요청입니다.")
        }

        return workspace
    }

    /**
     * taskid로 task 인스턴스 조회 및 반환
     */
    private fun resolveTask(
        workspace: Workspace,
        taskId: Long?,
    ): WorkspaceTask? {
        if (taskId == null) {
            return null
        }

        val task = workspaceTaskRepository.findById(taskId).getOrNull()
            ?: throw NotFoundException("태스크를 찾을 수 없습니다.")

        if (task.workspace.id != workspace.id) {
            throw BadRequestException("현재 워크스페이스에 속한 태스크만 연결할 수 있습니다.")
        }

        return task
    }

    private fun findLogsByCursor(
        cursor: String?,
        size: Int,
        findFirstPage: (PageRequest) -> List<WorkspaceLog>,
        findAfterCursor: (DateTimeIdCursor, PageRequest) -> List<WorkspaceLog>,
    ): WorkspaceLogCursorResponse {
        val safeSize = size.coerceIn(1, WORKSPACE_LOGS_PAGE_SIZE)
        val cursorMarker = cursor?.let(DateTimeIdCursorCodec::decode)
        val pageable = PageRequest.of(0, safeSize + 1)
        val logs = if (cursorMarker == null) {
            findFirstPage(pageable)
        } else {
            findAfterCursor(cursorMarker, pageable)
        }

        return toCursorResponse(logs, safeSize)
    }

    private fun toCursorResponse(logs: List<WorkspaceLog>, safeSize: Int): WorkspaceLogCursorResponse {
        val hasNext = logs.size > safeSize
        val pageLogs = logs.take(safeSize)

        return WorkspaceLogCursorResponse(
            logs = pageLogs.map(::toResponse),
            size = safeSize,
            nextCursor = pageLogs.lastOrNull()
                ?.takeIf { hasNext }
                ?.let { log -> DateTimeIdCursorCodec.encode(log.createdAt, requireNotNull(log.id)) },
            hasNext = hasNext,
        )
    }

    private fun resolveStatus(kind: LogKind, requestedStatus: LogStatus?): LogStatus {
        return when (kind) {
            LogKind.ISSUE -> when (requestedStatus) {
                null, LogStatus.OPEN -> LogStatus.OPEN
                LogStatus.CLOSED -> LogStatus.CLOSED
                LogStatus.NONE -> throw BadRequestException("이슈 로그는 OPEN 또는 CLOSED 상태여야 합니다.")
            }

            else -> {
                if (requestedStatus != null && requestedStatus != LogStatus.NONE) {
                    throw BadRequestException("이슈가 아닌 로그는 NONE 상태만 사용할 수 있습니다.")
                }

                LogStatus.NONE
            }
        }
    }

    private fun toResponse(log: WorkspaceLog): WorkspaceLogResponse {
        val author = log.author

        return WorkspaceLogResponse(
            id = requireNotNull(log.id),
            kind = log.kind,
            status = log.status,
            title = log.title,
            summary = log.summary,
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            taskId = log.task?.id,
            createdAt = log.createdAt.toString(),
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
        private const val WORKSPACE_LOGS_PAGE_SIZE = 20
    }
}
