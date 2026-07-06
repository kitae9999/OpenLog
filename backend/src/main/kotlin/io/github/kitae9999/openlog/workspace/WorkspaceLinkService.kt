package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.workspace.entity.LogLink
import io.github.kitae9999.openlog.workspace.entity.LogLinkRelation
import io.github.kitae9999.openlog.workspace.repository.LogLinkRepository
import io.github.kitae9999.openlog.workspace.repository.TaskLinkRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkspaceLinkService(
    private val logLinkRepository: LogLinkRepository,
    private val taskLinkRepository: TaskLinkRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
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
}
