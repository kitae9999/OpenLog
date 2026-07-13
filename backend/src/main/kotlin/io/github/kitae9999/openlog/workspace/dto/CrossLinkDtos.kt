package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.workspace.entity.CrossLinkRelation
import io.github.kitae9999.openlog.workspace.entity.WorkspaceNodeType

data class CreateCrossLinkRequest(
    val fromType: WorkspaceNodeType,
    val fromNodeId: Long,
    val toType: WorkspaceNodeType,
    val toNodeId: Long,
    val relation: CrossLinkRelation,
)

data class CrossLinkResponse(
    val id: Long,
    val fromType: WorkspaceNodeType,
    val fromNodeId: Long,
    val toType: WorkspaceNodeType,
    val toNodeId: Long,
    val relation: CrossLinkRelation,
    val createdAt: String,
)
