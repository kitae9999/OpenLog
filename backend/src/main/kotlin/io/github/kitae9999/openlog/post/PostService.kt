package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.command.PostWriteCommand
import io.github.kitae9999.openlog.post.entity.PostLink
import io.github.kitae9999.openlog.post.dto.PostWriteResponse
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.repository.PostLinkRepository
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
    private val postLinkRepository: PostLinkRepository,
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

        syncPostLinks(savedPost, postWriteCommand)

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
        val isLinksChanged = syncPostLinks(post, postWriteCommand)

        if (!isPostChanged && (isTopicsChanged || isLinksChanged)) { // Post의 제목, 설명, 본문이 바뀌지 않고 부가 관계만 바뀌었다면 Post 엔티티의 updatedAt만 최신화
            post.touchUpdatedAt()
        }

        if (isPostChanged || isTopicsChanged || isLinksChanged) {
            suggestionRepository.markOpenSuggestionsOutdated(postId)
        }

        return PostWriteResponse(
            authorUsername = authorUsername,
            slug = post.slug,
        )
    }

    private fun syncPostLinks(post: Post, postWriteCommand: PostWriteCommand): Boolean {
        val sourcePostId = post.id ?: return false
        val authorId = requireNotNull(post.author.id)
        val activeLabels = parseWikiLinkLabels(postWriteCommand.content)
        val currentLinks = postLinkRepository.findAllBySourcePostId(sourcePostId)

        if (activeLabels.isEmpty()) {
            if (currentLinks.isNotEmpty()) {
                postLinkRepository.deleteAll(currentLinks)
            }
            return currentLinks.isNotEmpty()
        }

        val submittedLinksByLabel = postWriteCommand.links.asSequence()
            .mapNotNull { link ->
                val label = normalizeWikiLinkLabel(link.label)
                val targetSlug = link.targetSlug.trim()
                if (label == null || targetSlug.isBlank()) {
                    null
                } else {
                    label to targetSlug
                }
            }
            .distinctBy { it.first }
            .toMap()

        val nextLinks = activeLabels.mapNotNull { label ->
            val submittedTarget = submittedLinksByLabel[label]
                ?.let { targetSlug -> postRepository.findByAuthorIdAndSlug(authorId, targetSlug) }
            val targetPost = submittedTarget ?: resolvePostByExactTitle(authorId, label)
            val targetPostId = targetPost?.id ?: return@mapNotNull null

            if (targetPostId == sourcePostId) {
                return@mapNotNull null
            }

            PostLink(
                sourcePost = post,
                targetPost = targetPost,
                label = label,
            )
        }.distinctBy { "${requireNotNull(it.targetPost.id)}\u0000${it.label}" }

        val currentSignature = currentLinks
            .map { "${requireNotNull(it.targetPost.id)}\u0000${it.label}" }
            .toSet()
        val nextSignature = nextLinks
            .map { "${requireNotNull(it.targetPost.id)}\u0000${it.label}" }
            .toSet()

        if (currentSignature == nextSignature) {
            return false
        }

        if (currentLinks.isNotEmpty()) {
            postLinkRepository.deleteAllBySourcePostId(sourcePostId)
            postLinkRepository.flush()
        }
        if (nextLinks.isNotEmpty()) {
            postLinkRepository.saveAll(nextLinks)
        }

        return true
    }

    private fun resolvePostByExactTitle(authorId: Long, label: String): Post? {
        val matches = postRepository.findAllByAuthorIdAndTitle(authorId, label)
        return matches.singleOrNull()
    }

    private fun parseWikiLinkLabels(content: String): List<String> {
        return WIKI_LINK_PATTERN.findAll(content)
            .mapNotNull { match -> normalizeWikiLinkLabel(match.groupValues[1]) }
            .distinct()
            .toList()
    }

    private fun normalizeWikiLinkLabel(label: String): String? {
        val normalized = label.trim()
        return normalized.takeIf { it.isNotEmpty() }
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
        private val WIKI_LINK_PATTERN = Regex("\\[\\[([^\\[\\]\\n]+)]]")
    }
}
