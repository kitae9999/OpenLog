package io.github.kitae9999.openlog.discussion

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.discussion.dto.DiscussionResponse
import io.github.kitae9999.openlog.discussion.entity.Discussion
import io.github.kitae9999.openlog.discussion.repository.DiscussionRepository
import io.github.kitae9999.openlog.suggest.repository.SuggestionRepository
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DiscussionService (
    private val discussionRepository: DiscussionRepository,
    private val suggestionRepository: SuggestionRepository,
){
    @Transactional
    fun createDiscussion(
        currentUser: User,
        postId: Long,
        suggestionId: Long,
        content: String
    ): DiscussionResponse {
        val suggestion = suggestionRepository.findByIdAndPostId(suggestionId, postId)
            ?: throw NotFoundException("포스트에 존재하지 않는 Suggestion입니다.")

        val discussion = discussionRepository.save(
            Discussion(
                suggestion = suggestion,
                user = currentUser,
                content = content,
            )
        )

        return toDiscussionResponse(discussion, requireNotNull(currentUser.id))
    }

    fun toDiscussionResponse(discussion: Discussion, currentUserId: Long?): DiscussionResponse {
        val author = discussion.user
        val authorId = requireNotNull(author.id)

        return DiscussionResponse(
            id = requireNotNull(discussion.id),
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            content = discussion.content,
            createdAt = discussion.createdAt.toString(),
            canManage = currentUserId == authorId,
        )
    }

    private fun resolveAuthorName(user: User): String {
        return when {
            !user.nickname.isNullOrBlank() -> user.nickname.orEmpty()
            !user.username.isNullOrBlank() -> user.username.orEmpty()
            !user.email.isNullOrBlank() -> user.email.orEmpty()
            else -> "OpenLog member"
        }
    }
}
