package io.github.kitae9999.openlog.workspace.repository

import io.github.kitae9999.openlog.workspace.entity.TaskLink
import io.github.kitae9999.openlog.workspace.entity.TaskLinkRelation
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface TaskLinkRepository : JpaRepository<TaskLink, Long> {
    fun existsByFromTaskIdAndToTaskIdAndRelation(
        fromTaskId: Long,
        toTaskId: Long,
        relation: TaskLinkRelation,
    ): Boolean

    @Query(
        """
        select tl
        from TaskLink tl
        join fetch tl.fromTask ft
        join fetch ft.author
        join fetch tl.toTask tt
        join fetch tt.author
        where ft.workspace.id = :workspaceId
          and tt.workspace.id = :workspaceId
        order by tl.createdAt desc, tl.id desc
        """
    )
    fun findAllByWorkspaceId(@Param("workspaceId") workspaceId: Long): List<TaskLink>
}
