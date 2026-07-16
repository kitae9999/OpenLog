package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.common.resolveAuthorName
import io.github.kitae9999.openlog.post.dto.PostDetailResponse
import io.github.kitae9999.openlog.post.dto.OwnedPostResponse
import io.github.kitae9999.openlog.post.dto.SourceOutputResponse
import io.github.kitae9999.openlog.post.dto.PostWikiLinkResponse
import io.github.kitae9999.openlog.post.dto.PostWriteResponse
import io.github.kitae9999.openlog.post.dto.RecentPostResponse
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.entity.PostLink
import org.springframework.stereotype.Component

@Component
class PostMapper {
    fun toRecentPostResponse(post: Post, likeCount: Long, commentCount: Long): RecentPostResponse {
        val postId = requireNotNull(post.id)

        return RecentPostResponse(
            id = postId,
            status = post.status,
            slug = post.slug,
            title = post.title,
            description = post.description,
            publishedAtLabel = formatPublishedAtLabel(post),
            authorUsername = requireNotNull(post.author.username),
            authorName = resolveAuthorName(post.author),
            authorAvatarSrc = post.author.profileImageUrl,
            thumbnailSrc = extractFirstMarkdownImageSrc(post.content),
            likes = likeCount.toInt(),
            comments = commentCount.toInt(),
        )
    }

    fun toWriteResponse(post: Post, authorUsername: String): PostWriteResponse {
        return PostWriteResponse(
            id = requireNotNull(post.id),
            status = post.status,
            authorUsername = authorUsername,
            slug = post.slug,
        )
    }

    fun toOwnedResponse(
        post: Post,
        topics: List<String>,
        wikiLinks: List<PostWikiLinkResponse>,
    ): OwnedPostResponse {
        return OwnedPostResponse(
            id = requireNotNull(post.id),
            status = post.status,
            slug = post.slug,
            title = post.title,
            description = post.description,
            content = post.content,
            authorUsername = requireNotNull(post.author.username),
            version = post.version,
            topics = topics,
            wikiLinks = wikiLinks,
            sourceOutput = post.output?.let { output ->
                SourceOutputResponse(
                    id = requireNotNull(output.id),
                    workspaceId = requireNotNull(output.workspace.id),
                )
            },
            createdAt = post.createdAt.toString(),
            updatedAt = post.updatedAt.toString(),
            publishedAt = post.publishedAt?.toString(),
            unpublishedAt = post.unpublishedAt?.toString(),
        )
    }

    fun toWikiLinkResponse(link: PostLink): PostWikiLinkResponse {
        return PostWikiLinkResponse(
            label = link.label,
            targetSlug = link.targetPost.slug,
            targetTitle = link.targetPost.title,
        )
    }

    fun toDetailResponse(
        post: Post,
        topics: List<String>,
        wikiLinks: List<PostWikiLinkResponse>,
        likes: Int,
        liked: Boolean,
    ): PostDetailResponse {
        return PostDetailResponse(
            id = requireNotNull(post.id),
            slug = post.slug,
            title = post.title,
            description = post.description,
            content = post.content,
            authorUsername = requireNotNull(post.author.username),
            authorName = resolveAuthorName(post.author),
            authorAvatarSrc = post.author.profileImageUrl,
            publishedAtLabel = formatPublishedAtLabel(post),
            version = post.version,
            topics = topics,
            wikiLinks = wikiLinks,
            likes = likes,
            liked = liked,
        )
    }
}
