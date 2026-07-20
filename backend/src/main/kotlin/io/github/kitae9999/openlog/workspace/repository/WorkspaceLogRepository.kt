package io.github.kitae9999.openlog.workspace.repository

import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogStatus
import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface WorkspaceLogRepository : JpaRepository<WorkspaceLog, Long> {
    fun countByWorkspaceId(workspaceId: Long): Long

    fun countByWorkspaceIdAndKindAndStatus(
        workspaceId: Long,
        kind: LogKind,
        status: LogStatus,
    ): Long

    fun findAllByWorkspaceIdOrderByCreatedAtDesc(workspaceId: Long): List<WorkspaceLog>

    fun findAllByWorkspaceIdAndKindAndStatusOrderByCreatedAtDesc(
        workspaceId: Long,
        kind: LogKind,
        status: LogStatus,
    ): List<WorkspaceLog>

    @EntityGraph(attributePaths = ["author", "task"])
    fun findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(
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
            l.updatedAt < :updatedAt
            or (l.updatedAt = :updatedAt and l.id < :id)
          )
        order by l.updatedAt desc, l.id desc
        """
    )
    fun findWorkspaceLogsAfterCursor(
        @Param("workspaceId") workspaceId: Long,
        @Param("updatedAt") updatedAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<WorkspaceLog>

    @EntityGraph(attributePaths = ["author", "task"])
    fun findAllByTaskIdOrderByUpdatedAtDescIdDesc(
        taskId: Long,
        pageable: Pageable,
    ): List<WorkspaceLog>

    @EntityGraph(attributePaths = ["author", "task"])
    @Query(
        """
        select l
        from WorkspaceLog l
        where l.task.id = :taskId
          and (
            l.updatedAt < :updatedAt
            or (l.updatedAt = :updatedAt and l.id < :id)
          )
        order by l.updatedAt desc, l.id desc
        """
    )
    fun findTaskLogsAfterCursor(
        @Param("taskId") taskId: Long,
        @Param("updatedAt") updatedAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<WorkspaceLog>

    @Query(
        """
        select l.createdAt
        from WorkspaceLog l
        where l.workspace.id = :workspaceId
          and l.createdAt >= :from
          and l.createdAt < :toExclusive
        order by l.createdAt asc
        """
    )
    fun findCreatedAtByWorkspaceIdAndRange(
        @Param("workspaceId") workspaceId: Long,
        @Param("from") from: LocalDateTime,
        @Param("toExclusive") toExclusive: LocalDateTime,
    ): List<LocalDateTime>

    @EntityGraph(attributePaths = ["author", "task"])
    fun findAllByWorkspaceIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
        workspaceId: Long,
        from: LocalDateTime,
        toExclusive: LocalDateTime,
    ): List<WorkspaceLog>
}
