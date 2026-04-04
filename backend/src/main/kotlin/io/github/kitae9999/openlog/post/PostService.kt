package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.blog.repository.BlogRepository
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.dto.CreatePostRequest
import io.github.kitae9999.openlog.post.dto.PostDetailResponse
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.posttopic.entity.PostTopic
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
import io.github.kitae9999.openlog.topic.entity.Topic
import io.github.kitae9999.openlog.topic.repository.TopicRepository
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service
import java.time.format.DateTimeFormatter
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
    fun createPost(userId: Long, createPostRequest: CreatePostRequest): Post {
        val user = userRepository.findById(userId).getOrNull() ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val blog = blogRepository.findByUserId(userId) ?: throw NotFoundException("블로그를 찾을 수 없습니다.")
        val (title, description, content, topics) = createPostRequest

        val savedPost = postRepository.save(
            Post(
                blog = blog,
                author = user,
                title = title,
                description = description,
                content = content,
            )
        )

        val normalizedTopics = normalizeTopics(topics)
        if (normalizedTopics.isEmpty()) {
            return savedPost
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

        return savedPost
    }

    @Transactional
    fun getPostDetail(postId: Long): PostDetailResponse {
        val post = postRepository.findById(postId).getOrNull() ?: throw NotFoundException("글을 찾을 수 없습니다.")
        val topics = postTopicRepository.findAllByPostId(postId)
            .map { it.topic.name }
            .sorted()

        return PostDetailResponse(
            id = requireNotNull(post.id),
            title = post.title,
            description = post.description,
            content = post.content,
            authorName = resolveAuthorName(post),
            authorAvatarSrc = post.author.profileImageUrl,
            publishedAtLabel = post.createdAt.format(PUBLISHED_AT_FORMATTER),
            readTimeLabel = estimateReadTimeLabel(post),
            topics = topics,
        )
    }

    private fun normalizeTopics(rawTopics: List<String>): List<String> {
        return rawTopics.asSequence()
            .map { it.trim().lowercase() }
            .filter(String::isNotBlank)
            .distinct()
            .toList()
    }

    private fun resolveAuthorName(post: Post): String {
        val author = post.author
        return when {
            !author.nickname.isNullOrBlank() -> author.nickname.orEmpty()
            !author.username.isNullOrBlank() -> author.username.orEmpty()
            !author.email.isNullOrBlank() -> author.email.orEmpty()
            else -> "OpenLog member"
        }
    }

    private fun estimateReadTimeLabel(post: Post): String {
        val wordCount = countWords("${post.title} ${post.description} ${post.content}")
        val minutes = if (wordCount == 0) 1 else maxOf(1, kotlin.math.ceil(wordCount / 220.0).toInt())
        return "$minutes min read"
    }

    private fun countWords(value: String): Int {
        val trimmed = value.trim()
        if (trimmed.isEmpty()) {
            return 0
        }

        return trimmed.split(Regex("\\s+")).size
    }

    companion object {
        private val PUBLISHED_AT_FORMATTER = DateTimeFormatter.ofPattern("yyyy. M. d.")
    }
}
