package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.workspace.entity.LogLinkRelation

data class CreateLogLinkRequest (
    val fromLogId: Long,
    val toLogId: Long,
    val relation: LogLinkRelation,
)
