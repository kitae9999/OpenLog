package io.github.kitae9999.openlog.post.dto

data class RecentPostCursorResponse(
    val posts: List<RecentPostResponse>,
    val size: Int,
    val nextCursor: String?,
    val hasNext: Boolean,
)

