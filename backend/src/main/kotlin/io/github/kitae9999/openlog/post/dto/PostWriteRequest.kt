package io.github.kitae9999.openlog.post.dto

import jakarta.validation.constraints.NotBlank

data class PostWriteRequest(
    @field:NotBlank(message = "제목은 필수입니다.")
    val title: String,

    @field:NotBlank(message = "설명은 필수입니다.")
    val description: String,

    @field:NotBlank(message = "본문은 필수입니다.")
    val content: String,

    val topics: List<String> = emptyList(),
)
