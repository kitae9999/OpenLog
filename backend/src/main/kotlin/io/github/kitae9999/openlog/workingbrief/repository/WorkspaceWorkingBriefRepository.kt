package io.github.kitae9999.openlog.workingbrief.repository

import io.github.kitae9999.openlog.workingbrief.entity.WorkspaceWorkingBrief
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository

interface WorkspaceWorkingBriefRepository : JpaRepository<WorkspaceWorkingBrief, Long> {
    @EntityGraph(attributePaths = ["task"])
    fun findByWorkspaceId(workspaceId: Long): WorkspaceWorkingBrief?
}
