package io.github.kitae9999.openlog.worklog.repository

import io.github.kitae9999.openlog.worklog.entity.Workspace
import org.springframework.data.jpa.repository.JpaRepository

interface WorkspaceRepository : JpaRepository<Workspace, Long> {
    fun findByOwnerIdAndSlug(ownerId: Long, slug: String): Workspace?
    fun existsByOwnerIdAndSlug(ownerId: Long, slug: String): Boolean
}
