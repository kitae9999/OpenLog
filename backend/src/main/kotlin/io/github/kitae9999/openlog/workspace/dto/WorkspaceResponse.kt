package io.github.kitae9999.openlog.workspace.dto

data class WorkspaceResponse(
    val id: Long,
    val slug: String,
    val name: String,
    val projects: List<WorkspaceProjectResponse>,
    val createdAt: String,
    val updatedAt: String,
)
