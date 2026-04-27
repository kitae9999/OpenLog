package io.github.kitae9999.openlog.discussion.dto

data class DiscussionResponse(
    val id: Long,
    val authorName: String,
    val authorProfileImageUrl: String?,
    val content: String,
    val createdAt: String,
    val canManage: Boolean,
)
