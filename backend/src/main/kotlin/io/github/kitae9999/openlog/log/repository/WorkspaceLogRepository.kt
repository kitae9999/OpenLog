package io.github.kitae9999.openlog.log.repository

import io.github.kitae9999.openlog.log.entity.LogKind
import io.github.kitae9999.openlog.log.entity.LogStatus
import io.github.kitae9999.openlog.log.entity.WorkspaceLog
import org.springframework.data.jpa.repository.JpaRepository

interface WorkspaceLogRepository : JpaRepository<WorkspaceLog, Long> {
    fun findAllByWorkspaceIdOrderByCreatedAtDesc(workspaceId: Long): List<WorkspaceLog>
    fun findAllByWorkspaceIdAndKindAndStatusOrderByCreatedAtDesc(
        workspaceId: Long,
        kind: LogKind,
        status: LogStatus,
    ): List<WorkspaceLog>
}
