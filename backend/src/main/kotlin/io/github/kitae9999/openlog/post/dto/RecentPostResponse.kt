package io.github.kitae9999.openlog.post.dto

import io.github.kitae9999.openlog.post.entity.PostStatus

data class RecentPostResponse(
    val id: Long,
    val status: PostStatus,
    val slug: String,
    val title: String,
    val description: String,
    val publishedAtLabel: String,
    val authorUsername: String,
    val authorName: String,
    val authorAvatarSrc: String?,
    val authorIsOpenLogOfficial: Boolean,
    val thumbnailSrc: String?,
    val likes: Int,
    val comments: Int,
)
