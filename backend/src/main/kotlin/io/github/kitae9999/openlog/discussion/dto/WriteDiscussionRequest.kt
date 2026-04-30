package io.github.kitae9999.openlog.discussion.dto

import jakarta.validation.constraints.NotBlank

data class WriteDiscussionRequest(
    @field:NotBlank(message = "댓글 내용은 필수입니다.")
    val content: String
)
