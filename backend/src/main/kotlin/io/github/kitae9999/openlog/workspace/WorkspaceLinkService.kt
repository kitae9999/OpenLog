package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.workspace.dto.TaskLinkResponse
import io.github.kitae9999.openlog.workspace.entity.LogLink
import io.github.kitae9999.openlog.workspace.entity.LogLinkRelation
import io.github.kitae9999.openlog.workspace.entity.LogLinkResponse
import io.github.kitae9999.openlog.workspace.entity.TaskLink
import io.github.kitae9999.openlog.workspace.entity.TaskLinkRelation
import io.github.kitae9999.openlog.workspace.repository.LogLinkRepository
import io.github.kitae9999.openlog.workspace.repository.TaskLinkRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class WorkspaceLinkService(
    private val logLinkRepository: LogLinkRepository,
    private val taskLinkRepository: TaskLinkRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val workspaceMapper: WorkspaceMapper,
) {
    @Transactional
    fun createLogLink(
        userId: Long,
        workspaceId: Long,
        fromLogId: Long,
        toLogId: Long,
        relation: LogLinkRelation,
    ) {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val fromLog = workspaceAccessResolver.requireOwnedLog(workspace, fromLogId)
        val toLog = workspaceAccessResolver.requireOwnedLog(workspace, toLogId)

        if (fromLog.id == toLog.id) {
            throw BadRequestException("같은 로그끼리는 연결할 수 없습니다.")
        }

        if (logLinkRepository.existsByFromLogIdAndToLogIdAndRelation(fromLogId, toLogId, relation)) {
            throw BadRequestException("이미 연결된 로그입니다.")
        }

        logLinkRepository.save(
            LogLink(
                fromLog = fromLog,
                toLog = toLog,
                relation = relation,
            )
        )
    }

    @Transactional(readOnly = true)
    fun getLogLinks(
        userId: Long,
        workspaceId: Long,
    ): List<LogLinkResponse> {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val logLinks = logLinkRepository.findAllByWorkspaceId(requireNotNull(workspace.id))

        return logLinks.map(workspaceMapper::toLogLinkResponse)
    }

    @Transactional
    fun deleteLogLink(userId: Long, workspaceId: Long, logLinkId: Long) {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val logLink = logLinkRepository.findById(logLinkId).getOrNull()
            ?: throw NotFoundException("로그 링크를 찾을 수 없습니다.")

        if (logLink.fromLog.workspace.id != workspace.id || logLink.toLog.workspace.id != workspace.id) {
            throw BadRequestException("현재 워크스페이스에 속한 로그 링크만 삭제할 수 있습니다.")
        }

        logLinkRepository.delete(logLink)
    }

    @Transactional
    fun createTaskLink(
        userId: Long,
        workspaceId: Long,
        fromTaskId: Long,
        toTaskId: Long,
        relation: TaskLinkRelation,
    ): TaskLinkResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val fromTask = workspaceAccessResolver.requireOwnedTask(workspace, fromTaskId)
        val toTask = workspaceAccessResolver.requireOwnedTask(workspace, toTaskId)

        if (fromTask.id == toTask.id) {
            throw BadRequestException("같은 태스크끼리는 연결할 수 없습니다.")
        }

        if (taskLinkRepository.existsByFromTaskIdAndToTaskIdAndRelation(fromTaskId, toTaskId, relation)) {
            throw BadRequestException("이미 연결된 태스크입니다.")
        }

        val taskLink = taskLinkRepository.save(
            TaskLink(
                fromTask = fromTask,
                toTask = toTask,
                relation = relation,
            )
        )

        return workspaceMapper.toTaskLinkResponse(taskLink)
    }

    @Transactional(readOnly = true)
    fun getTaskLinks(
        userId: Long,
        workspaceId: Long,
    ): List<TaskLinkResponse> {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val taskLinks = taskLinkRepository.findAllByWorkspaceId(requireNotNull(workspace.id))

        return taskLinks.map(workspaceMapper::toTaskLinkResponse)
    }

    @Transactional
    fun deleteTaskLink(userId: Long, workspaceId: Long, taskLinkId: Long) {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val taskLink = taskLinkRepository.findById(taskLinkId).getOrNull()
            ?: throw NotFoundException("태스크 링크를 찾을 수 없습니다.")

        if (taskLink.fromTask.workspace.id != workspace.id || taskLink.toTask.workspace.id != workspace.id) {
            throw BadRequestException("현재 워크스페이스에 속한 태스크 링크만 삭제할 수 있습니다.")
        }

        taskLinkRepository.delete(taskLink)
    }

}
