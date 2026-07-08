package io.github.kitae9999.openlog.output.dto

import jakarta.validation.constraints.NotBlank

data class PublishOutputRequest(
    @field:NotBlank(message = "게시글 설명은 필수입니다.")
    val description: String,
    val topics: List<String> = emptyList(),
)
