package io.github.kitae9999.openlog.discussion

import io.github.kitae9999.openlog.common.exception.NotFoundException
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
    ): Discussion{
        val suggestion = suggestionRepository.findByIdAndPostId(suggestionId, postId)
            ?: throw NotFoundException("포스트에 존재하지 않는 Suggestion입니다.")

        return discussionRepository.save(
            Discussion(
                suggestion = suggestion,
                user = currentUser,
                content = content,
            )
        )
    }
}
