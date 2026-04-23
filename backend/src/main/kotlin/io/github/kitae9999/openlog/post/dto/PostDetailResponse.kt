package io.github.kitae9999.openlog.post.dto

data class PostDetailResponse(
    val id: Long,
    val slug: String,
    val title: String,
    val description: String,
    val content: String,
    val authorUsername: String,
    val authorName: String,
    val authorAvatarSrc: String?,
    val publishedAtLabel: String,
    val topics: List<String>,
    val likes: Int = 0,
    val liked: Boolean = false,
    val comments: Int = 0,
)
