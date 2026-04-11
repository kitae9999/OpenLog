package io.github.kitae9999.openlog.comment.dto

data class CommentResponse(
    val id: Long,
    val authorName: String,
    val authorProfileImageUrl: String?,
    val content: String,
    val createdAt: String,
)
