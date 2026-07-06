package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.task.entity.TaskStatus

data class WorkspaceTaskResponse(
    val id: Long,
    val title: String,
    val description: String?,
    val content: String?,
    val status: TaskStatus,
    val authorName: String,
    val authorProfileImageUrl: String?,
    val createdAt: String,
    val updatedAt: String,
)

data class WorkspaceTaskCursorResponse(
    val tasks: List<WorkspaceTaskResponse>,
    val size: Int,
    val nextCursor: String?,
    val hasNext: Boolean,
)
