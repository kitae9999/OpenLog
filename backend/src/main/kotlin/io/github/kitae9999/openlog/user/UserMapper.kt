package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.entity.PostLink
import io.github.kitae9999.openlog.post.extractFirstMarkdownImageSrc
import io.github.kitae9999.openlog.post.formatPublishedAtLabel
import io.github.kitae9999.openlog.user.dto.PublicUserPostGraphEdgeResponse
import io.github.kitae9999.openlog.user.dto.PublicUserPostGraphNodeResponse
import io.github.kitae9999.openlog.user.dto.PublicUserPostSummaryResponse
import io.github.kitae9999.openlog.user.dto.PublicUserProfileResponse
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.stereotype.Component

@Component
class UserMapper {
    fun toPublicProfileResponse(
        user: User,
        following: Boolean,
        followersCount: Long,
        followingCount: Long,
    ): PublicUserProfileResponse {
        return PublicUserProfileResponse(
            username = requireNotNull(user.username),
            nickname = user.nickname,
            profileImageUrl = user.profileImageUrl,
            bio = user.bio,
            location = user.location,
            websiteUrl = user.websiteUrl,
            joinedAt = user.createdAt.toString(),
            following = following,
            followersCount = followersCount,
            followingCount = followingCount,
        )
    }

    fun toPublicPostSummaryResponse(post: Post): PublicUserPostSummaryResponse {
        return PublicUserPostSummaryResponse(
            slug = post.slug,
            title = post.title,
            description = post.description,
            publishedAtLabel = formatPublishedAtLabel(post),
            thumbnailSrc = extractFirstMarkdownImageSrc(post.content),
        )
    }

    fun toPublicPostGraphNodeResponse(post: Post): PublicUserPostGraphNodeResponse {
        return PublicUserPostGraphNodeResponse(
            slug = post.slug,
            title = post.title,
            description = post.description,
        )
    }

    fun toPublicPostGraphEdgeResponse(link: PostLink): PublicUserPostGraphEdgeResponse {
        return PublicUserPostGraphEdgeResponse(
            sourceSlug = link.sourcePost.slug,
            targetSlug = link.targetPost.slug,
            label = link.label,
        )
    }
}
