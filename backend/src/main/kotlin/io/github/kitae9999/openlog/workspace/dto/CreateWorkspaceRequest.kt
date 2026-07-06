package io.github.kitae9999.openlog.workspace.dto

import jakarta.validation.constraints.NotBlank

data class CreateWorkspaceRequest(
    @field:NotBlank(message = "워크스페이스 slug는 필수입니다.")
    val slug: String,

    @field:NotBlank(message = "워크스페이스 이름은 필수입니다.")
    val name: String,

    val repoFullName: String? = null,
)
