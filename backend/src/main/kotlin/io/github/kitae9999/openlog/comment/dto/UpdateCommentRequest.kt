package io.github.kitae9999.openlog.comment.dto

import jakarta.validation.constraints.NotBlank

data class UpdateCommentRequest(
    @field:NotBlank(message = "수정할 내용을 작성해주세요.")
    val content: String
)
