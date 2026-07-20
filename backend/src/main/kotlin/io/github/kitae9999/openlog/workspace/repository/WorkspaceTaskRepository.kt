package io.github.kitae9999.openlog.workspace.repository

import io.github.kitae9999.openlog.workspace.entity.TaskStatus
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface WorkspaceTaskRepository : JpaRepository<WorkspaceTask, Long> {
    fun countByWorkspaceIdAndStatus(workspaceId: Long, status: TaskStatus): Long

    @EntityGraph(attributePaths = ["author"])
    fun findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(
        workspaceId: Long,
        pageable: Pageable,
    ): List<WorkspaceTask>

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select t
        from WorkspaceTask t
        where t.workspace.id = :workspaceId
          and (
            t.updatedAt < :updatedAt
            or (t.updatedAt = :updatedAt and t.id < :id)
          )
        order by t.updatedAt desc, t.id desc
        """
    )
    fun findWorkspaceTasksAfterCursor(
        @Param("workspaceId") workspaceId: Long,
        @Param("updatedAt") updatedAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<WorkspaceTask>

    @EntityGraph(attributePaths = ["author"])
    fun findAllByWorkspaceIdAndStatusOrderByUpdatedAtDescIdDesc(
        workspaceId: Long,
        status: TaskStatus,
        pageable: Pageable,
    ): List<WorkspaceTask>

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select t
        from WorkspaceTask t
        where t.workspace.id = :workspaceId
          and t.status = :status
          and (
            t.updatedAt < :updatedAt
            or (t.updatedAt = :updatedAt and t.id < :id)
          )
        order by t.updatedAt desc, t.id desc
        """
    )
    fun findWorkspaceTasksByStatusAfterCursor(
        @Param("workspaceId") workspaceId: Long,
        @Param("status") status: TaskStatus,
        @Param("updatedAt") updatedAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<WorkspaceTask>
}
