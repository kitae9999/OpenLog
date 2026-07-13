package io.github.kitae9999.openlog.output.repository

import io.github.kitae9999.openlog.output.entity.OutputStatus
import io.github.kitae9999.openlog.output.entity.WorkspaceOutput
import org.springframework.data.jpa.repository.JpaRepository

interface WorkspaceOutputRepository : JpaRepository<WorkspaceOutput, Long> {
    fun findAllByWorkspaceIdOrderByUpdatedAtDesc(workspaceId: Long): List<WorkspaceOutput>
    fun findAllByWorkspaceIdAndStatusOrderByUpdatedAtDesc(workspaceId: Long, status: OutputStatus): List<WorkspaceOutput>
}
