package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursor
import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursorCodec
import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogDetailResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogResponse
import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogStatus
import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
import io.github.kitae9999.openlog.workspace.repository.WorkspaceLogRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceLogRequest
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceLogRequest
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkspaceLogService(
    private val workspaceLogRepository: WorkspaceLogRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val workspaceMapper: WorkspaceMapper,
) {
    @Transactional(readOnly = true)
    fun getLogs(
        userId: Long,
        workspaceId: Long,
        taskId: Long?,
        cursor: String?,
        size: Int,
    ): WorkspaceLogCursorResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        if (taskId != null) {
            workspaceAccessResolver.resolveTask(workspace, taskId)
        }

        return findLogsByCursor(
            cursor = cursor,
            size = size,
            findFirstPage = { pageable ->
                if (taskId == null) {
                    workspaceLogRepository.findAllByWorkspaceIdOrderByCreatedAtDescIdDesc(
                        workspaceId = workspaceId,
                        pageable = pageable,
                    )
                } else {
                    workspaceLogRepository.findAllByTaskIdOrderByCreatedAtDescIdDesc(
                        taskId = taskId,
                        pageable = pageable,
                    )
                }
            },
            findAfterCursor = { cursorMarker, pageable ->
                if (taskId == null) {
                    workspaceLogRepository.findWorkspaceLogsAfterCursor(
                        workspaceId = workspaceId,
                        createdAt = cursorMarker.createdAt,
                        id = cursorMarker.id,
                        pageable = pageable,
                    )
                } else {
                    workspaceLogRepository.findTaskLogsAfterCursor(
                        taskId = taskId,
                        createdAt = cursorMarker.createdAt,
                        id = cursorMarker.id,
                        pageable = pageable,
                    )
                }
            },
        )
    }

    @Transactional(readOnly = true)
    fun getLogDetail(userId: Long, workspaceId: Long, logId: Long): WorkspaceLogDetailResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val log = workspaceAccessResolver.requireOwnedLog(workspace, logId)

        return workspaceMapper.toLogDetailResponse(log)
    }

    @Transactional
    fun createLog(user: User, workspaceId: Long, request: CreateWorkspaceLogRequest): WorkspaceLogResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(requireNotNull(user.id), workspaceId)
        val task = workspaceAccessResolver.resolveTask(workspace, request.taskId)
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
        task?.touch()

        return workspaceMapper.toLogResponse(savedLog)
    }

    @Transactional
    fun updateLog(
        userId: Long,
        workspaceId: Long,
        logId: Long,
        request: UpdateWorkspaceLogRequest,
    ): WorkspaceLogDetailResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val log = workspaceAccessResolver.requireOwnedLog(workspace, logId)
        val task = workspaceAccessResolver.resolveTask(workspace, request.taskId)
        val status = resolveStatus(log.kind, request.status ?: log.status)

        log.update(
            title = request.title.trim(),
            summary = request.summary?.trim()?.takeIf { it.isNotEmpty() },
            content = request.content.trim(),
            task = task,
            status = status,
        )
        task?.touch()

        return workspaceMapper.toLogDetailResponse(log)
    }

    @Transactional
    fun deleteLog(userId: Long, workspaceId: Long, logId: Long) {
        deleteLogs(userId, workspaceId, listOf(logId))
    }

    @Transactional
    fun deleteLogs(userId: Long, workspaceId: Long, logIds: List<Long>) {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val logs = logIds.distinct().map { logId ->
            workspaceAccessResolver.requireOwnedLog(workspace, logId)
        }

        workspaceLogRepository.deleteAll(logs)
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
            logs = pageLogs.map(workspaceMapper::toLogResponse),
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

    companion object {
        private const val WORKSPACE_LOGS_PAGE_SIZE = 20
    }
}
