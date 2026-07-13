package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.workspace.entity.LogStatus
import jakarta.validation.constraints.NotBlank

data class UpdateWorkspaceLogRequest(
    @field:NotBlank(message = "제목은 필수입니다.")
    val title: String,

    @field:NotBlank(message = "본문은 필수입니다.")
    val content: String,

    val summary: String? = null,

    val taskId: Long? = null,

    val status: LogStatus? = null,
)