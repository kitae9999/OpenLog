package io.github.kitae9999.openlog.post.dto

import io.github.kitae9999.openlog.post.entity.PostStatus

data class OwnedPostResponse(
    val id: Long,
    val status: PostStatus,
    val slug: String,
    val title: String,
    val description: String,
    val content: String,
    val authorUsername: String,
    val version: Long,
    val topics: List<String>,
    val wikiLinks: List<PostWikiLinkResponse>,
    val sourceOutput: SourceOutputResponse?,
    val createdAt: String,
    val updatedAt: String,
    val publishedAt: String?,
    val unpublishedAt: String?,
)

data class SourceOutputResponse(
    val id: Long,
    val workspaceId: Long,
)
