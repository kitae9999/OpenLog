package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.command.PostWriteCommand
import io.github.kitae9999.openlog.post.dto.PostWriteResponse
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.posttopic.entity.PostTopic
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
import io.github.kitae9999.openlog.suggest.repository.SuggestionRepository
import io.github.kitae9999.openlog.topic.entity.Topic
import io.github.kitae9999.openlog.topic.repository.TopicRepository
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class PostService(
    private val postRepository: PostRepository,
    private val postTopicRepository: PostTopicRepository,
    private val suggestionRepository: SuggestionRepository,
    private val topicRepository: TopicRepository,
) {
    @Transactional
    fun createPost(user: User, postWriteCommand: PostWriteCommand): PostWriteResponse {
        val userId = requireNotNull(user.id)
        val authorUsername = user.username?.trim().orEmpty()
        if (authorUsername.isBlank()) {
            throw NotFoundException("username이 설정된 사용자를 찾을 수 없습니다.")
        }
        val (title, description, content, topics) = postWriteCommand
        val slug = generateUniqueSlug(userId, title)

        val savedPost = postRepository.save(
            Post(
                author = user,
                slug = slug,
                title = title,
                description = description,
                content = content,
            )
        )

        val normalizedTopics = normalizeTopics(topics)
        if (normalizedTopics.isEmpty()) {
            return PostWriteResponse(
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

        return PostWriteResponse(
            authorUsername = authorUsername,
            slug = savedPost.slug,
        )
    }

    @Transactional
    fun deletePost(userId: Long, postId: Long) {
        val postToDelete = postRepository.findById(postId).getOrNull() ?: throw NotFoundException("존재하지 않는 포스트입니다.")
        if (userId != postToDelete.author.id){
            throw ForbiddenException("권한이 없습니다.")
        }

        postRepository.delete(postToDelete)
    }

    @Transactional
    fun updatePost(userId: Long, postId: Long, postWriteCommand: PostWriteCommand): PostWriteResponse {
        val post = postRepository.findById(postId).getOrNull() ?: throw NotFoundException("존재하지 않는 포스트입니다.")
        if (userId != post.author.id) {
            throw ForbiddenException("권한이 없습니다.")
        }
        val authorUsername = post.author.username?.trim().orEmpty()
        if (authorUsername.isBlank()) {
            throw NotFoundException("username이 설정된 사용자를 찾을 수 없습니다.")
        }
        val (title, description, content, topics) = postWriteCommand
        val nextSlug = if (title == post.title) {
            post.slug
        } else {
            generateUniqueSlug(userId, title, postId)
        }

        val isPostChanged = post.updatePost(nextSlug, title, description, content)
        val isTopicsChanged = replacePostTopics(post, topics)

        if (!isPostChanged && isTopicsChanged) { // Post의 제목, 설명, 본문이 바뀌지 않고 Topic 만 바뀌었다면 Post 엔티티의 updatedAt만 최신화
            post.touchUpdatedAt()
        }

        if (isPostChanged || isTopicsChanged) {
            suggestionRepository.markOpenSuggestionsOutdated(postId)
        }

        return PostWriteResponse(
            authorUsername = authorUsername,
            slug = post.slug,
        )
    }

    /**
     * 수정된 Topic 목록으로 교체
     */
    private fun replacePostTopics(post: Post, rawTopics: List<String>): Boolean {
        val postId = requireNotNull(post.id)
        val currentPostTopics = postTopicRepository.findAllByPostId(postId)
        val currentTopicNames = currentPostTopics.map { it.topic.name }.toSet()
        val nextTopicNames = normalizeTopics(rawTopics)
        val nextTopicNameSet = nextTopicNames.toSet()

        val postTopicsToDelete = currentPostTopics.filter { it.topic.name !in nextTopicNameSet }
        if (postTopicsToDelete.isNotEmpty()) {
            postTopicRepository.deleteAll(postTopicsToDelete)
        }

        val topicNamesToAdd = nextTopicNames.filterNot(currentTopicNames::contains)
        if (topicNamesToAdd.isEmpty()) {
            return postTopicsToDelete.isNotEmpty()
        }

        val existingTopics = topicRepository.findByNameIn(topicNamesToAdd)
        val existingNames = existingTopics.mapTo(mutableSetOf()) { it.name }
        val newTopics = topicNamesToAdd
            .filterNot(existingNames::contains) // 인스턴스 메서드 참조 넘김
            .map { Topic(name = it) } // 람다의 파라미터가 하나면 it 사용
        val savedNewTopics = if (newTopics.isEmpty()) {
            emptyList()
        } else {
            topicRepository.saveAll(newTopics).toList()
        }
        val topicsByName = (existingTopics + savedNewTopics).associateBy { it.name }

        postTopicRepository.saveAll(
            topicNamesToAdd.map { topicName ->
                PostTopic(
                    post = post,
                    topic = requireNotNull(topicsByName[topicName]),
                )
            }
        )

        return true
    }

    private fun normalizeTopics(rawTopics: List<String>): List<String> {
        return rawTopics.asSequence() // map, filter등의 다음 단계가 중간과정에서 리스트를 반환하지않고 하나의 요소에 대해 전부 실행
            .map { it.trim().lowercase() }
            .filter(String::isNotBlank)
            .distinct()
            .toList()
    }

    private fun generateUniqueSlug(authorId: Long, title: String, excludedPostId: Long? = null): String {
        val baseSlug = slugify(title)
        var candidate = baseSlug
        var suffix = 2

        while (existsSlug(authorId, candidate, excludedPostId)) {
            candidate = "$baseSlug-$suffix"
            suffix += 1
        }

        return candidate
    }

    private fun existsSlug(authorId: Long, slug: String, excludedPostId: Long?): Boolean {
        return if (excludedPostId == null) {
            postRepository.existsByAuthorIdAndSlug(authorId, slug)
        } else {
            postRepository.existsByAuthorIdAndSlugAndIdNot(authorId, slug, excludedPostId)
        }
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
