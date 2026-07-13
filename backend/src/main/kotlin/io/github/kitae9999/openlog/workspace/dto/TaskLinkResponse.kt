package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.workspace.entity.TaskLinkRelation

data class TaskLinkResponse(
    val id: Long,
    val fromTask: WorkspaceTaskResponse,
    val toTask: WorkspaceTaskResponse,
    val relation: TaskLinkRelation,
    val createdAt: String,
)
