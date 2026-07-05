package io.github.kitae9999.openlog.log.dto

data class WorkspaceLogCursorResponse(
    val logs: List<WorkspaceLogResponse>,
    val size: Int,
    val nextCursor: String?,
    val hasNext: Boolean,
)
