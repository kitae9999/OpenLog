package io.github.kitae9999.openlog.workspace.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class WorkspaceAgentGuideResponse(
    val workspaceId: Long,
    val content: String,
    val revision: Long,
    val createdAt: String,
    val updatedAt: String,
)

data class UpdateWorkspaceAgentGuideRequest(
    @field:NotBlank(message = "Agent Guide 내용은 필수입니다.")
    @field:Size(max = 20_000, message = "Agent Guide는 20,000자 이하여야 합니다.")
    val content: String,
)
