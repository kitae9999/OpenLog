package io.github.kitae9999.openlog.output.dto

import jakarta.validation.constraints.NotBlank

data class UpdateOutputRequest(
    @field:NotBlank(message = "Output 제목은 필수입니다.")
    val title: String,
    @field:NotBlank(message = "Output 본문은 필수입니다.")
    val content: String,
    val taskIds: List<Long> = emptyList(),
    val logIds: List<Long> = emptyList(),
)
