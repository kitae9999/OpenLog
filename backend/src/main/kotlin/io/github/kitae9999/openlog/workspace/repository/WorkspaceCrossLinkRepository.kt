package io.github.kitae9999.openlog.workspace.repository

import io.github.kitae9999.openlog.workspace.entity.WorkspaceCrossLink
import org.springframework.data.jpa.repository.JpaRepository

interface WorkspaceCrossLinkRepository : JpaRepository<WorkspaceCrossLink, Long> {
    fun findAllByWorkspaceIdOrderByCreatedAtAsc(workspaceId: Long): List<WorkspaceCrossLink>
}
