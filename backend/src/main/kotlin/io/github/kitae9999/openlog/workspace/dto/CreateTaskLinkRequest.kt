package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.workspace.entity.TaskLinkRelation

data class CreateTaskLinkRequest(
    val fromTaskId: Long,
    val toTaskId: Long,
    val relation: TaskLinkRelation,
)
