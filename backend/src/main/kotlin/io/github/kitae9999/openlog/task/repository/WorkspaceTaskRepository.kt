package io.github.kitae9999.openlog.task.repository

import io.github.kitae9999.openlog.task.entity.WorkspaceTask
import org.springframework.data.jpa.repository.JpaRepository

interface WorkspaceTaskRepository : JpaRepository<WorkspaceTask, Long> {
    fun findAllByWorkspaceIdOrderByUpdatedAtDesc(workspaceId: Long): List<WorkspaceTask>
}
