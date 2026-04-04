package io.github.kitae9999.openlog.post.dto

data class PostDetailResponse(
    val id: Long,
    val title: String,
    val description: String,
    val content: String,
    val authorName: String,
    val authorAvatarSrc: String?,
    val publishedAtLabel: String,
    val readTimeLabel: String,
    val topics: List<String>,
    val likes: Int = 0,
    val comments: Int = 0,
)
