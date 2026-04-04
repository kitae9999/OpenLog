package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.blog.repository.BlogRepository
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.dto.CreatePostRequest
import io.github.kitae9999.openlog.post.dto.CreatePostResponse
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.posttopic.entity.PostTopic
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
import io.github.kitae9999.openlog.topic.entity.Topic
import io.github.kitae9999.openlog.topic.repository.TopicRepository
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class PostService(
    private val blogRepository: BlogRepository,
    private val postRepository: PostRepository,
    private val postTopicRepository: PostTopicRepository,
    private val topicRepository: TopicRepository,
    private val userRepository: UserRepository,
) {
    @Transactional
    fun createPost(userId: Long, createPostRequest: CreatePostRequest): CreatePostResponse {
        val user = userRepository.findById(userId).getOrNull() ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val blog = blogRepository.findByUserId(userId) ?: throw NotFoundException("블로그를 찾을 수 없습니다.")
        val authorUsername = user.username?.trim().orEmpty()
        if (authorUsername.isBlank()) {
            throw NotFoundException("username이 설정된 사용자를 찾을 수 없습니다.")
        }
        val (title, description, content, topics) = createPostRequest
        val slug = generateUniqueSlug(userId, title)

        val savedPost = postRepository.save(
            Post(
                blog = blog,
                author = user,
                slug = slug,
                title = title,
                description = description,
                content = content,
            )
        )

        val normalizedTopics = normalizeTopics(topics)
        if (normalizedTopics.isEmpty()) {
            return CreatePostResponse(
                authorUsername = authorUsername,
                slug = savedPost.slug,
            )
        }

        val existingTopics = topicRepository.findByNameIn(normalizedTopics)
        val existingNames = existingTopics.mapTo(mutableSetOf()) { it.name }
        val newTopics = normalizedTopics
            .filterNot(existingNames::contains)
            .map { Topic(name = it) }
        val savedTopics = existingTopics + topicRepository.saveAll(newTopics)

        postTopicRepository.saveAll(
            savedTopics.map { topic ->
                PostTopic(
                    post = savedPost,
                    topic = topic,
                )
            }
        )

        return CreatePostResponse(
            authorUsername = authorUsername,
            slug = savedPost.slug,
        )
    }

    private fun normalizeTopics(rawTopics: List<String>): List<String> {
        return rawTopics.asSequence()
            .map { it.trim().lowercase() }
            .filter(String::isNotBlank)
            .distinct()
            .toList()
    }

    private fun generateUniqueSlug(authorId: Long, title: String): String {
        val baseSlug = slugify(title)
        var candidate = baseSlug
        var suffix = 2

        while (postRepository.existsByAuthorIdAndSlug(authorId, candidate)) {
            candidate = "$baseSlug-$suffix"
            suffix += 1
        }

        return candidate
    }

    private fun slugify(title: String): String {
        val slug = NON_SLUG_CHARACTERS.replace(title.trim().lowercase(), "-")
            .trim('-')
        return if (slug.isBlank()) "post" else slug
    }

    companion object {
        private val NON_SLUG_CHARACTERS = Regex("[^\\p{L}\\p{N}]+")
    }
}
