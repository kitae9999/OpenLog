package io.github.kitae9999.openlog.workspace.entity

import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogResponse

data class LogLinkResponse(
    val id: Long,
    val fromLog: WorkspaceLogResponse,
    val toLog: WorkspaceLogResponse,
    val relation: LogLinkRelation,
)
