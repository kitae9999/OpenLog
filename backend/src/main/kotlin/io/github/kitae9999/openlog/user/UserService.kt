package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.estimateReadTimeLabel
import io.github.kitae9999.openlog.post.formatPublishedAtLabel
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.post.dto.PostDetailResponse
import io.github.kitae9999.openlog.post.resolveAuthorName
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
import io.github.kitae9999.openlog.user.dto.PublicUserPostSummaryResponse
import io.github.kitae9999.openlog.user.dto.PublicUserProfileResponse
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepository: UserRepository,
    private val postRepository: PostRepository,
    private val postTopicRepository: PostTopicRepository,
) {
    @Transactional
    fun getPublicProfile(username: String): PublicUserProfileResponse {
        val user = userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")

        return PublicUserProfileResponse(
            username = requireNotNull(user.username),
            nickname = user.nickname,
            profileImageUrl = user.profileImageUrl,
            bio = user.bio,
            joinedAt = user.createdAt.toString(),
        )
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
                readTimeLabel = estimateReadTimeLabel(post),
            )
        }
    }

    @Transactional
    fun getPublicPostDetail(username: String, slug: String): PostDetailResponse {
        val user = userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val post = postRepository.findByAuthorIdAndSlug(requireNotNull(user.id), slug)
            ?: throw NotFoundException("글을 찾을 수 없습니다.")
        val topics = postTopicRepository.findAllByPostId(requireNotNull(post.id))
            .map { it.topic.name }
            .sorted()

        return PostDetailResponse(
            id = requireNotNull(post.id),
            slug = post.slug,
            title = post.title,
            description = post.description,
            content = post.content,
            authorUsername = requireNotNull(post.author.username),
            authorName = resolveAuthorName(post),
            authorAvatarSrc = post.author.profileImageUrl,
            publishedAtLabel = formatPublishedAtLabel(post),
            readTimeLabel = estimateReadTimeLabel(post),
            topics = topics,
        )
    }
}
