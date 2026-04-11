package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.resolveAuthorName
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
import io.github.kitae9999.openlog.user.entity.User
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
    fun getPublicProfile(username: String): User =
        userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")

    @Transactional
    fun getPublicPosts(username: String): List<Post> {
        val user = userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val authorId = requireNotNull(user.id)

        return postRepository.findAllByAuthorIdOrderByCreatedAtDesc(authorId)
    }

    @Transactional
    fun getPublicPostDetail(username: String, slug: String): PublicPostDetail {
        val user = userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val post = postRepository.findByAuthorIdAndSlug(requireNotNull(user.id), slug)
            ?: throw NotFoundException("글을 찾을 수 없습니다.")
        val author = post.author
        val topics = postTopicRepository.findAllByPostId(requireNotNull(post.id))
            .map { it.topic.name }
            .sorted()

        return PublicPostDetail(
            post = post,
            authorUsername = requireNotNull(author.username),
            authorName = resolveAuthorName(post),
            authorAvatarSrc = author.profileImageUrl,
            topics = topics,
        )
    }

    @Transactional
    fun updateProfile(
        username: String,
        nickname: String,
        bio: String?,
        location: String?,
        websiteUrl: String?,
    ): User {
        val user = userRepository.findByUsername(username)
            ?: throw NotFoundException("사용자를 찾을 수 없습니다.")

        user.updateProfile(
            nickname = nickname.trim(),
            bio = bio?.trim()?.takeIf { it.isNotEmpty() },
            location = location?.trim()?.takeIf { it.isNotEmpty() },
            websiteUrl = websiteUrl?.trim()?.takeIf { it.isNotEmpty() },
        )

        return user
    }
}

data class PublicPostDetail(
    val post: Post,
    val authorUsername: String,
    val authorName: String,
    val authorAvatarSrc: String?,
    val topics: List<String>,
)
