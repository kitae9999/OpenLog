package io.github.kitae9999.openlog.output.dto

import io.github.kitae9999.openlog.output.entity.OutputStatus
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
    val createdAt: String,
    val updatedAt: String,
    val publishedAt: String?,
)

data class OutputDetailResponse(
    val id: Long,
    val status: OutputStatus,
    val title: String,
    val content: String,
    val authorName: String,
    val tasks: List<OutputTaskSourceResponse>,
    val logs: List<OutputLogSourceResponse>,
    val publishedPost: PublishedOutputPostResponse?,
    val createdAt: String,
    val updatedAt: String,
    val publishedAt: String?,
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

data class PublishedOutputPostResponse(
    val authorUsername: String,
    val slug: String,
)
