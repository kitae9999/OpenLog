package io.github.kitae9999.openlog.workspace.repository

import io.github.kitae9999.openlog.workspace.entity.WorkspaceProject
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository

interface WorkspaceProjectRepository : JpaRepository<WorkspaceProject, Long> {
    @EntityGraph(attributePaths = ["workspace", "owner"])
    fun findAllByOwnerIdOrderByUpdatedAtDescIdDesc(ownerId: Long): List<WorkspaceProject>

    @EntityGraph(attributePaths = ["workspace", "owner"])
    fun findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(workspaceId: Long): List<WorkspaceProject>

    @EntityGraph(attributePaths = ["workspace", "owner"])
    fun findByIdAndOwnerId(id: Long, ownerId: Long): WorkspaceProject?

    @EntityGraph(attributePaths = ["workspace", "owner"])
    fun findByOwnerIdAndRepositoryKey(ownerId: Long, repositoryKey: String): WorkspaceProject?

    fun existsByOwnerIdAndRepositoryKeyAndIdNot(ownerId: Long, repositoryKey: String, id: Long): Boolean
}
