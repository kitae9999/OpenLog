package io.github.kitae9999.openlog.log.dto

import io.github.kitae9999.openlog.log.entity.LogKind
import io.github.kitae9999.openlog.log.entity.LogStatus

data class WorkspaceLogResponse(
    val id: Long,
    val kind: LogKind,
    val status: LogStatus,
    val title: String,
    val summary: String?,
    val authorName: String,
    val authorProfileImageUrl: String?,
    val taskId: Long?,
    val createdAt: String,
)
