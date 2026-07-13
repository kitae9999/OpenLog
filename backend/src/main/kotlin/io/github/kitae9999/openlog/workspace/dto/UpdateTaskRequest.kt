package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.workspace.entity.TaskStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class UpdateTaskRequest(
    @field:NotBlank(message = "태스크 제목은 필수입니다.")
    val title: String,
    val description: String? = null,
    val content: String? = null,
    @field:NotNull(message = "태스크 상태는 필수입니다.")
    val status: TaskStatus,
)
