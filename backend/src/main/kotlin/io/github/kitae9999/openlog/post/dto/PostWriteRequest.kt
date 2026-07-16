package io.github.kitae9999.openlog.post.dto

data class PostWriteRequest(
    val title: String,

    val description: String,

    val content: String,

    val topics: List<String> = emptyList(),

    val links: List<PostLinkWriteRequest> = emptyList(),
)
