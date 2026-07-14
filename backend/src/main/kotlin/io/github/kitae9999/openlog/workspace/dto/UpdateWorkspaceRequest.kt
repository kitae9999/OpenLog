package io.github.kitae9999.openlog.workspace.dto

import jakarta.validation.constraints.NotBlank

data class UpdateWorkspaceRequest(
    @field:NotBlank(message = "워크스페이스 이름은 필수입니다.")
    val name: String,
)
