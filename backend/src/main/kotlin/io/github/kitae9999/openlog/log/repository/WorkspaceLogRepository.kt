package io.github.kitae9999.openlog.log.repository

import io.github.kitae9999.openlog.log.entity.LogKind
import io.github.kitae9999.openlog.log.entity.LogStatus
import io.github.kitae9999.openlog.log.entity.WorkspaceLog
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface WorkspaceLogRepository : JpaRepository<WorkspaceLog, Long> {
    fun findAllByWorkspaceIdOrderByCreatedAtDesc(workspaceId: Long): List<WorkspaceLog>

    fun findAllByWorkspaceIdAndKindAndStatusOrderByCreatedAtDesc(
        workspaceId: Long,
        kind: LogKind,
        status: LogStatus,
    ): List<WorkspaceLog>

    @EntityGraph(attributePaths = ["author", "task"])
    fun findAllByWorkspaceIdOrderByCreatedAtDescIdDesc(
        workspaceId: Long,
        pageable: Pageable,
    ): List<WorkspaceLog>

    @EntityGraph(attributePaths = ["author", "task"])
    @Query(
        """
        select l
        from WorkspaceLog l
        where l.workspace.id = :workspaceId
          and (
            l.createdAt < :createdAt
            or (l.createdAt = :createdAt and l.id < :id)
          )
        order by l.createdAt desc, l.id desc
        """
    )
    fun findWorkspaceLogsAfterCursor(
        @Param("workspaceId") workspaceId: Long,
        @Param("createdAt") createdAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<WorkspaceLog> 
}
