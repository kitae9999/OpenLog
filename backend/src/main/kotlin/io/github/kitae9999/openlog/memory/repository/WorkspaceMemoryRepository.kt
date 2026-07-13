package io.github.kitae9999.openlog.memory.repository

import io.github.kitae9999.openlog.memory.entity.WorkspaceMemory
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface WorkspaceMemoryRepository : JpaRepository<WorkspaceMemory, Long> {
    @EntityGraph(attributePaths = ["task", "originLog"])
    fun findByOriginLogId(originLogId: Long): WorkspaceMemory?

    @EntityGraph(attributePaths = ["task", "originLog"])
    fun findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(
        workspaceId: Long,
        pageable: Pageable,
    ): List<WorkspaceMemory>

    @EntityGraph(attributePaths = ["task", "originLog"])
    @Query(
        """
        select m
        from WorkspaceMemory m
        where m.workspace.id = :workspaceId
          and (
            m.updatedAt < :updatedAt
            or (m.updatedAt = :updatedAt and m.id < :id)
          )
        order by m.updatedAt desc, m.id desc
        """
    )
    fun findMemoriesAfterCursor(
        @Param("workspaceId") workspaceId: Long,
        @Param("updatedAt") updatedAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<WorkspaceMemory>
}
