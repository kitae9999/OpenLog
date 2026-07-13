package io.github.kitae9999.openlog.todo.dto

data class TodoResponse(
    val id: Long,
    val title: String,
    val done: Boolean,
    val plannedFor: String,
    val sortOrder: Int,
    val taskId: Long?,
    val createdAt: String,
    val updatedAt: String,
    val completedAt: String?,
)
