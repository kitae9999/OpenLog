package io.github.kitae9999.openlog.output.dto

import io.github.kitae9999.openlog.output.entity.OutputStatus
import io.github.kitae9999.openlog.post.entity.PostStatus
import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogStatus
import io.github.kitae9999.openlog.workspace.entity.TaskStatus

data class OutputResponse(
    val id: Long,
    val status: OutputStatus,
    val title: String,
    val authorName: String,
    val taskCount: Int,
    val logCount: Int,
    val taskIds: List<Long>,
    val logIds: List<Long>,
    val createdAt: String,
    val updatedAt: String,
    val exportedAt: String?,
)

data class OutputDetailResponse(
    val id: Long,
    val status: OutputStatus,
    val title: String,
    val content: String,
    val authorName: String,
    val tasks: List<OutputTaskSourceResponse>,
    val logs: List<OutputLogSourceResponse>,
    val linkedPost: LinkedOutputPostResponse?,
    val createdAt: String,
    val updatedAt: String,
    val exportedAt: String?,
)

data class OutputTaskSourceResponse(
    val id: Long,
    val title: String,
    val status: TaskStatus,
)

data class OutputLogSourceResponse(
    val id: Long,
    val title: String,
    val kind: LogKind,
    val status: LogStatus,
    val taskId: Long?,
)

data class LinkedOutputPostResponse(
    val id: Long,
    val status: PostStatus,
    val authorUsername: String,
    val slug: String,
)
