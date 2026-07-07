package io.github.kitae9999.openlog.suggest

import io.github.kitae9999.openlog.discussion.DiscussionMapper
import io.github.kitae9999.openlog.discussion.entity.Discussion
import io.github.kitae9999.openlog.suggest.dto.SuggestionDetailResponse
import io.github.kitae9999.openlog.suggest.dto.SuggestionSummaryResponse
import io.github.kitae9999.openlog.suggest.entity.Suggestion
import org.springframework.stereotype.Component

@Component
class SuggestionMapper(
    private val discussionMapper: DiscussionMapper,
) {
    fun toSummaryResponse(suggestion: Suggestion, commentCount: Int): SuggestionSummaryResponse {
        return SuggestionSummaryResponse(
            id = requireNotNull(suggestion.id),
            title = suggestion.title,
            status = suggestion.status,
            authorName = suggestion.user.nickname
                ?: suggestion.user.username
                ?: "Unknown",
            authorProfileImageUrl = suggestion.user.profileImageUrl,
            createdAt = suggestion.createdAt,
            updatedAt = suggestion.updatedAt,
            commentCount = commentCount,
        )
    }

    fun toDetailResponse(
        suggestion: Suggestion,
        discussions: List<Discussion>,
        currentUserId: Long?,
    ): SuggestionDetailResponse {
        return SuggestionDetailResponse(
            id = requireNotNull(suggestion.id),
            title = suggestion.title,
            content = suggestion.content,
            baseContent = suggestion.baseContent,
            description = suggestion.description,
            status = suggestion.status,
            authorId = requireNotNull(suggestion.user.id),
            authorName = suggestion.user.nickname
                ?: suggestion.user.username
                ?: "Unknown",
            authorProfileImageUrl = suggestion.user.profileImageUrl,
            createdAt = suggestion.createdAt,
            postBaseVersion = suggestion.postBaseVersion,
            discussions = discussions.map { discussion ->
                discussionMapper.toResponse(discussion, currentUserId)
            },
        )
    }
}
