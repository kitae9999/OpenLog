package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.task.entity.TaskStatus

data class TaskDetailResponse(
    val id: Long,
    val title: String,
    val description: String?,
    val content: String?,
    val status: TaskStatus,
    val author: TaskAuthorResponse,
    val createdAt: String,
    val updatedAt: String
)

data class TaskAuthorResponse(
    val id: Long,
    val username: String,
    val nickname: String,
    val profileImageUrl: String?
)