package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.comment.repository.CommentRepository
import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursorCodec
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.follow.FollowRepository
import io.github.kitae9999.openlog.follow.entity.FollowId
import io.github.kitae9999.openlog.post.dto.PostDetailResponse
import io.github.kitae9999.openlog.post.dto.RecentPostCursorResponse
import io.github.kitae9999.openlog.post.dto.RecentPostResponse
import io.github.kitae9999.openlog.post.dto.PostWikiLinkResponse
import io.github.kitae9999.openlog.post.formatPublishedAtLabel
import io.github.kitae9999.openlog.post.repository.PostLinkRepository
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.post.resolveAuthorName
import io.github.kitae9999.openlog.postlike.PostLikeRepository
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
import io.github.kitae9999.openlog.user.dto.PublicUserPostSummaryResponse
import io.github.kitae9999.openlog.user.dto.PublicUserPostGraphEdgeResponse
import io.github.kitae9999.openlog.user.dto.PublicUserPostGraphNodeResponse
import io.github.kitae9999.openlog.user.dto.PublicUserPostGraphResponse
import io.github.kitae9999.openlog.user.dto.PublicUserProfileResponse
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.transaction.Transactional
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepository: UserRepository,
    private val postRepository: PostRepository,
    private val postLinkRepository: PostLinkRepository,
    private val postTopicRepository: PostTopicRepository,
    private val postLikeRepository: PostLikeRepository,
    private val commentRepository: CommentRepository,
    private val followRepository: FollowRepository,
) {
    @Transactional
    fun getLikedPosts(userId: Long, cursor: String?, size: Int): RecentPostCursorResponse {
        val safeSize = size.coerceIn(1, LIKED_POSTS_PAGE_SIZE)
        val cursorMarker = cursor?.let(DateTimeIdCursorCodec::decode)
        val postLikes = if (cursorMarker == null) {
            postLikeRepository.findLikedPostsByUserId(
                userId = userId,
                pageable = PageRequest.of(0, safeSize + 1),
            )
        } else {
            postLikeRepository.findLikedPostsAfterCursor(
                userId = userId,
                createdAt = cursorMarker.createdAt,
                id = cursorMarker.id,
                pageable = PageRequest.of(0, safeSize + 1),
            )
        }
        val hasNext = postLikes.size > safeSize
        val pageItems = postLikes.take(safeSize)
        val postIds = pageItems.mapNotNull { it.post.id }
        val likeCounts = getPostLikeCounts(postIds)
        val commentCounts = getPostCommentCounts(postIds)

        return RecentPostCursorResponse(
            posts = pageItems.map { postLike ->
                val post = postLike.post
                val postId = requireNotNull(post.id)
                RecentPostResponse(
                    id = postId,
                    slug = post.slug,
                    title = post.title,
                    description = post.description,
                    publishedAtLabel = formatPublishedAtLabel(post),
                    authorUsername = requireNotNull(post.author.username),
                    authorName = resolveAuthorName(post),
                    authorAvatarSrc = post.author.profileImageUrl,
                    likes = likeCounts[postId]?.toInt() ?: 0,
                    comments = commentCounts[postId]?.toInt() ?: 0,
                )
            },
            size = safeSize,
            nextCursor = pageItems.lastOrNull()
                ?.takeIf { hasNext }
                ?.let { postLike -> DateTimeIdCursorCodec.encode(postLike.createdAt, requireNotNull(postLike.id)) },
            hasNext = hasNext,
        )
    }

    @Transactional
    fun getPublicProfile(username: String, viewerId: Long?): PublicUserProfileResponse {
        val user = userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val userId = requireNotNull(user.id)
        val following = viewerId
            ?.takeIf { it != userId }
            ?.let { followRepository.existsById(FollowId(followingUserId = it, followedUserId = userId)) }
            ?: false

        return toPublicUserProfileResponse(user, following)
    }

    @Transactional
    fun getPublicPosts(username: String): List<PublicUserPostSummaryResponse> {
        val user = userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val authorId = requireNotNull(user.id)

        return postRepository.findAllByAuthorIdOrderByCreatedAtDesc(authorId).map { post ->
            PublicUserPostSummaryResponse(
                slug = post.slug,
                title = post.title,
                description = post.description,
                publishedAtLabel = formatPublishedAtLabel(post),
            )
        }
    }

    @Transactional
    fun getPublicPostGraph(username: String): PublicUserPostGraphResponse {
        val user = userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val authorId = requireNotNull(user.id)
        val posts = postRepository.findAllByAuthorIdOrderByCreatedAtDesc(authorId)
        val postIds = posts.mapNotNull { it.id }
        val links = if (postIds.isEmpty()) {
            emptyList()
        } else {
            postLinkRepository.findAllBySourcePostIdIn(postIds)
                .filter { link -> link.targetPost.author.id == authorId }
        }

        return PublicUserPostGraphResponse(
            nodes = posts.map { post ->
                PublicUserPostGraphNodeResponse(
                    slug = post.slug,
                    title = post.title,
                    description = post.description,
                )
            },
            edges = links.map { link ->
                PublicUserPostGraphEdgeResponse(
                    sourceSlug = link.sourcePost.slug,
                    targetSlug = link.targetPost.slug,
                    label = link.label,
                )
            },
        )
    }

    @Transactional
    fun getPublicPostDetail(username: String, slug: String, viewerId: Long?): PostDetailResponse {
        val user = userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val post = postRepository.findByAuthorIdAndSlug(requireNotNull(user.id), slug)
            ?: throw NotFoundException("글을 찾을 수 없습니다.")
        val postId = requireNotNull(post.id)
        val topics = postTopicRepository.findAllByPostId(postId)
            .map { it.topic.name }
            .sorted()
        val wikiLinks = postLinkRepository.findAllBySourcePostId(postId)
            .map { link ->
                PostWikiLinkResponse(
                    label = link.label,
                    targetSlug = link.targetPost.slug,
                    targetTitle = link.targetPost.title,
                )
            }
            .distinctBy { "${it.targetSlug}\u0000${it.label}" }

        return PostDetailResponse(
            id = postId,
            slug = post.slug,
            title = post.title,
            description = post.description,
            content = post.content,
            authorUsername = requireNotNull(post.author.username),
            authorName = resolveAuthorName(post),
            authorAvatarSrc = post.author.profileImageUrl,
            publishedAtLabel = formatPublishedAtLabel(post),
            version = post.version,
            topics = topics,
            wikiLinks = wikiLinks,
            likes = postLikeRepository.countByPostId(postId).toInt(),
            liked = viewerId?.let { postLikeRepository.existsByPostIdAndUserId(postId, it) } ?: false,
        )
    }

    @Transactional
    fun updateProfile(
        userId: Long,
        username: String,
        nickname: String,
        bio: String?,
        location: String?,
        websiteUrl: String?,
    ): PublicUserProfileResponse {
        val user = userRepository.findByUsername(username)
            ?: throw NotFoundException("사용자를 찾을 수 없습니다.")

        if (user.id != userId) {
            throw ForbiddenException()
        }

        user.updateProfile(
            nickname = nickname.trim(),
            bio = bio?.trim()?.takeIf { it.isNotEmpty() },
            location = location?.trim()?.takeIf { it.isNotEmpty() },
            websiteUrl = websiteUrl?.trim()?.takeIf { it.isNotEmpty() },
        )

        return toPublicUserProfileResponse(user, following = false)
    }

    private fun toPublicUserProfileResponse(user: User, following: Boolean): PublicUserProfileResponse {
        val userId = requireNotNull(user.id)

        return PublicUserProfileResponse(
            username = requireNotNull(user.username),
            nickname = user.nickname,
            profileImageUrl = user.profileImageUrl,
            bio = user.bio,
            location = user.location,
            websiteUrl = user.websiteUrl,
            joinedAt = user.createdAt.toString(),
            following = following,
            followersCount = followRepository.countByFollowedUser_Id(userId),
            followingCount = followRepository.countByFollowingUser_Id(userId),
        )
    }

    private fun getPostLikeCounts(postIds: List<Long>): Map<Long, Long> {
        if (postIds.isEmpty()) {
            return emptyMap()
        }

        return postLikeRepository.countAllByPostIdIn(postIds).associate { it.postId to it.count }
    }

    private fun getPostCommentCounts(postIds: List<Long>): Map<Long, Long> {
        if (postIds.isEmpty()) {
            return emptyMap()
        }

        return commentRepository.countAllByPostIdIn(postIds).associate { it.postId to it.count }
    }

    private companion object {
        const val LIKED_POSTS_PAGE_SIZE = 10
    }
}
