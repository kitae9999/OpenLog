package io.github.kitae9999.openlog.workspace.repository

import io.github.kitae9999.openlog.workspace.entity.LogLink
import io.github.kitae9999.openlog.workspace.entity.LogLinkRelation
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface LogLinkRepository : JpaRepository<LogLink, Long> {
    fun findAllByFromLogId(fromLogId: Long): List<LogLink>
    fun findAllByToLogId(toLogId: Long): List<LogLink>
    fun existsByFromLogIdAndToLogIdAndRelation(
        fromLogId: Long,
        toLogId: Long,
        relation: LogLinkRelation,
    ): Boolean

    @Query(
        """
    select ll
    from LogLink ll
    join fetch ll.fromLog fl
    join fetch ll.toLog tl
    where fl.workspace.id = :workspaceId
      and tl.workspace.id = :workspaceId
    """
    )
    fun findAllByWorkspaceId(@Param("workspaceId") workspaceId: Long): List<LogLink>
}
