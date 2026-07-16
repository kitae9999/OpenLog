package io.github.kitae9999.openlog.post.dto

import io.github.kitae9999.openlog.post.entity.PostStatus

data class PostWriteResponse(
    val id: Long,
    val status: PostStatus,
    val authorUsername: String,
    val slug: String,
)
