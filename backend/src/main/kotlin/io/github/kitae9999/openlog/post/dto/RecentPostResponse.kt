package io.github.kitae9999.openlog.post.dto

data class RecentPostResponse(
    val id: Long,
    val slug: String,
    val title: String,
    val description: String,
    val publishedAtLabel: String,
    val authorUsername: String,
    val authorName: String,
    val authorAvatarSrc: String?,
    val likes: Int,
    val comments: Int,
)
