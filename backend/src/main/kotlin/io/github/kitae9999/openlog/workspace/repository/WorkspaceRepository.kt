package io.github.kitae9999.openlog.workspace.repository

import io.github.kitae9999.openlog.workspace.entity.Workspace
import org.springframework.data.jpa.repository.JpaRepository

interface WorkspaceRepository : JpaRepository<Workspace, Long> {
    fun findByOwnerIdAndSlug(ownerId: Long, slug: String): Workspace?
    fun existsByOwnerIdAndSlug(ownerId: Long, slug: String): Boolean
}
