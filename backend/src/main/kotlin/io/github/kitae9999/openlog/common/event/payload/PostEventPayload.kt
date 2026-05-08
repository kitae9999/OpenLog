package io.github.kitae9999.openlog.common.event.payload

import java.time.Instant

data class PostPublishedEventPayload(
    val post: PostPublushedPostPayload,
    val author: PostPublishedAuthorPayload,
    val eventCreatedAt: Instant,
)

data class PostPublishedAuthorPayload(
    val id: Long,
    val username: String,
    val nickname: String?,
    val profileImageUrl: String?,
)

data class PostPublushedPostPayload(
    val id: Long,
    val title: String,
    val slug: String,
)